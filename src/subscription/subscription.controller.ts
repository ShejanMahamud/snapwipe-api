import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { StripeService } from 'src/stripe/stripe.service';
import { Util } from 'src/utils/utils';
import { SubscriptionService } from './subscription.service';

@Controller('subscription')
export class SubscriptionController {
  constructor(
    private subscription: SubscriptionService,
    private stripe: StripeService,
  ) {}

  @Get('billing')
  billing(@Body() body: { customerId: string; returnUrl: string }) {
    return this.subscription.billingPortal(body.customerId, body.returnUrl);
  }

  @Post('create')
  create(@Body() body: { email: string; userId: string; priceId: string }) {
    return this.subscription.createSubscription(
      body.userId,
      body.email,
      body.priceId,
    );
  }

  @Post('webhook')
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    try {
      if (!req.rawBody) {
        throw new BadRequestException('Missing raw body');
      }
      const event = this.stripe.constructEvent(req.rawBody, sig);
      this.subscription.handleWebHook(event);
      return Util.success('Stripe event successfully');
    } catch (error) {
      throw new ForbiddenException('Something went wrong');
    }
  }
}
