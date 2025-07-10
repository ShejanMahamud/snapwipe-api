import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  constructor(private config: ConfigService) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY') as string, {
      apiVersion: '2025-06-30.basil',
    });
  }
  async createCustomer(email: string, userId: string) {
    return this.stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    });
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    return this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  }
  async createBillingPortal(customerId: string, returnUrl: string) {
    const res = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return res.url;
  }
  constructEvent(rawData: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      rawData,
      signature,
      this.config.get('STRIPE_WEBHOOK_SECRET') as string,
    );
  }
}
