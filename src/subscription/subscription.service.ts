import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { StripeService } from 'src/stripe/stripe.service';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionService {
  constructor(
    private stripe: StripeService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  private calculateNextResetDate(period: 'monthly' | 'yearly'): Date {
    const now = new Date();
    return period === 'monthly'
      ? new Date(now.setMonth(now.getMonth() + 1))
      : new Date(now.setFullYear(now.getFullYear() + 1));
  }

  async billingPortal(customerId: string, returnUrl: string) {
    return this.stripe.createBillingPortal(customerId, returnUrl);
  }

  async createSubscription(
    userId: string,
    email: string,
    priceId: string,
  ): Promise<string> {
    const customer = await this.stripe.createCustomer(email, userId);

    const session = await this.stripe.createCheckoutSession(
      customer.id,
      priceId,
      `${this.config.get('APP_URL')}/success`,
      `${this.config.get('APP_URL')}/cancel`,
    );

    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.isDeleted || !user.status) {
        throw new NotFoundException('Active user not found!');
      }

      await tx.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customer.id },
      });
    });

    return session.url!;
  }

  async handleWebHook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        const user = await this.prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (!user) throw new NotFoundException('User not found');

        // Find plan by price ID
        const priceId =
          session?.metadata?.priceId ||
          (session['display_items']?.[0]?.price?.id ??
            session['items']?.data?.[0]?.price?.id);

        if (!priceId) {
          throw new InternalServerErrorException(
            'Price ID not found in session',
          );
        }

        const plan = await this.prisma.plan.findFirst({
          where: { stripePriceId: priceId },
        });

        if (!plan) throw new NotFoundException('Plan not found');

        await this.prisma.subscription.create({
          data: {
            userId: user.id,
            planId: plan.id,
            stripeSubscriptionId: subscriptionId,
            status: true,
            nextResetDate: this.calculateNextResetDate(plan.planPeriod),
          },
        });

        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const stripeSubId = invoice.lines?.data?.[0]?.subscription as string;

        const stripeCustomerId = invoice.customer as string;

        const user = await this.prisma.user.findFirst({
          where: { stripeCustomerId },
        });

        if (!user) throw new NotFoundException('User not found');

        const subscription = await this.prisma.subscription.findFirst({
          where: {
            stripeSubscriptionId: stripeSubId,
            userId: user.id,
            status: true,
          },
        });

        if (!subscription) {
          throw new NotFoundException('Active subscription not found');
        }

        const paymentMethodId =
          await this.getOrCreatePaymentMethod('Stripe Card');

        await this.prisma.payment.create({
          data: {
            userId: user.id,
            subscriptionId: subscription.id,
            stripeInvoiceId: invoice.id ?? '',
            stripePaymentIntentId: '',
            amount: invoice.amount_paid.toString(),
            currency: invoice.currency,
            status: 'paid',
            periodStart: new Date(invoice.period_start * 1000),
            periodEnd: new Date(invoice.period_end * 1000),
            paymentMethodId,
          },
        });

        break;
      }

      case 'invoice.payment_failed':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        await this.prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { status: false },
        });

        break;
      }

      default:
        // Optionally log unhandled events
        break;
    }
  }

  // Create or reuse a default payment method from the DB
  private async getOrCreatePaymentMethod(name: string): Promise<string> {
    const existing = await this.prisma.paymentMethod.findFirst({
      where: { name },
    });

    if (existing) return existing.id;

    const created = await this.prisma.paymentMethod.create({
      data: {
        name,
        status: true,
      },
    });

    return created.id;
  }
}
