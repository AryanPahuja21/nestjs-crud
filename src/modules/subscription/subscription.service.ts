import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { Subscription, SubscriptionStatus } from '../../database/schemas/subscription.schema';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { UserService } from '../user/user.service';
import { NotFoundCustomException } from '../../common/exceptions/not-found.exception';
import { ValidationException } from '../../common/exceptions/validation.exception';
import { DatabaseException } from '../../common/exceptions/database.exception';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly stripe: Stripe;

  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
    private configService: ConfigService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-09-30.clover',
    });
  }

  /**
   * Get all available subscription plans from Stripe
   */
  async getAvailablePlans(): Promise<any[]> {
    try {
      this.logger.log('Fetching available subscription plans from Stripe');

      // Get all products
      const products = await this.stripe.products.list({
        active: true,
        expand: ['data.default_price'],
      });

      // Get prices for each product
      const plansWithPrices = await Promise.all(
        products.data.map(async (product) => {
          const prices = await this.stripe.prices.list({
            product: product.id,
            active: true,
            type: 'recurring',
          });

          return {
            id: product.id,
            name: product.name,
            description: product.description,
            prices: prices.data,
          };
        }),
      );

      this.logger.log(`Found ${plansWithPrices.length} subscription plans`);
      return plansWithPrices;
    } catch (error) {
      this.logger.error('Error fetching subscription plans:', error);
      throw new DatabaseException(
        `Failed to fetch subscription plans: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Create a new subscription for a user
   */
  async createSubscription(
    userId: string,
    dto: CreateSubscriptionDto,
  ): Promise<{ subscription: SubscriptionResponseDto; clientSecret?: string }> {
    try {
      const userIdNumber = parseInt(userId, 10);
      if (isNaN(userIdNumber) || userIdNumber <= 0) {
        throw new ValidationException(`Invalid user ID: ${userId}`);
      }

      this.logger.log(`Creating subscription for user ${userId} with price ${dto.priceId}`);

      // Get user details
      const user = await this.userService.findOne(userIdNumber);
      if (!user.stripeCustomerId) {
        throw new ValidationException(
          'User must have a Stripe customer ID to create subscriptions',
        );
      }

      // Check if user already has an active subscription
      const existingSubscription = await this.subscriptionModel.findOne({
        userId,
        status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      });

      if (existingSubscription) {
        throw new ValidationException('User already has an active subscription');
      }

      // Get price details from Stripe
      const price = await this.stripe.prices.retrieve(dto.priceId, {
        expand: ['product'],
      });

      if (!price.product || typeof price.product === 'string') {
        throw new ValidationException('Invalid price ID or product not found');
      }

      const product = price.product as Stripe.Product;

      // Create subscription in Stripe
      const stripeSubscription = await this.stripe.subscriptions.create({
        customer: user.stripeCustomerId,
        items: [{ price: dto.priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId,
          ...dto.metadata,
        },
      });

      // Create subscription record in database
      const subscription = new this.subscriptionModel({
        userId,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: user.stripeCustomerId,
        stripePriceId: dto.priceId,
        stripeProductId: product.id,
        productName: product.name,
        priceAmount: price.unit_amount || 0,
        currency: price.currency,
        interval: price.recurring?.interval || 'month',
        intervalCount: price.recurring?.interval_count || 1,
        status: stripeSubscription.status as SubscriptionStatus,
        currentPeriodStart: (stripeSubscription as any).current_period_start
          ? new Date(((stripeSubscription as any).current_period_start as number) * 1000)
          : undefined,
        currentPeriodEnd: (stripeSubscription as any).current_period_end
          ? new Date(((stripeSubscription as any).current_period_end as number) * 1000)
          : undefined,
        trialEnd: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : undefined,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        metadata: dto.metadata,
      });

      const savedSubscription = await subscription.save();

      // Update user's subscription info
      await this.userService.updateUserSubscriptionInfo(userIdNumber, {
        subscriptionId: stripeSubscription.id,
        subscriptionStatus: (stripeSubscription as any).status as string,
        subscriptionPlan: product.name,
        subscriptionEndDate: (stripeSubscription as any).current_period_end
          ? new Date(((stripeSubscription as any).current_period_end as number) * 1000)
          : undefined,
      });

      // Get client secret from payment intent if available
      let clientSecret: string | undefined;
      if (
        stripeSubscription.latest_invoice &&
        typeof stripeSubscription.latest_invoice === 'object'
      ) {
        const invoice = stripeSubscription.latest_invoice;
        const invoicePaymentIntent = (invoice as any).payment_intent as
          | Stripe.PaymentIntent
          | undefined;
        if (invoicePaymentIntent && typeof invoicePaymentIntent === 'object') {
          clientSecret = invoicePaymentIntent.client_secret || undefined;
        }
      }

      this.logger.log(`✅ Created subscription ${stripeSubscription.id} for user ${userId}`);

      return {
        subscription: this.mapToResponseDto(savedSubscription),
        clientSecret,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to create subscription for user ${userId}:`, error);
      if (error instanceof ValidationException) {
        throw error;
      }
      throw new DatabaseException(
        `Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<SubscriptionResponseDto | null> {
    try {
      const subscription = await this.subscriptionModel.findOne({ userId }).sort({ createdAt: -1 });

      if (!subscription) {
        return null;
      }

      return this.mapToResponseDto(subscription);
    } catch (error) {
      this.logger.error(`Error fetching subscription for user ${userId}:`, error);
      throw new DatabaseException(
        `Failed to fetch subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Update a subscription (change plan, payment method, etc.)
   */
  async updateSubscription(
    userId: string,
    dto: UpdateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    try {
      this.logger.log(`Updating subscription for user ${userId}`);

      const subscription = await this.subscriptionModel.findOne({
        userId,
        status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      });

      if (!subscription) {
        throw new NotFoundCustomException('Active subscription not found for user');
      }

      const updateData: any = {};

      // Update price if provided
      if (dto.priceId) {
        const price = await this.stripe.prices.retrieve(dto.priceId, {
          expand: ['product'],
        });

        if (!price.product || typeof price.product === 'string') {
          throw new ValidationException('Invalid price ID or product not found');
        }

        const product = price.product as Stripe.Product;

        // Update subscription in Stripe
        await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          items: [
            {
              id: (await this.stripe.subscriptions.retrieve(subscription.stripeSubscriptionId))
                .items.data[0].id,
              price: dto.priceId,
            },
          ],
          proration_behavior: 'create_prorations',
        });

        // Update local record
        updateData.stripePriceId = dto.priceId;
        updateData.stripeProductId = product.id;
        updateData.productName = product.name;
        updateData.priceAmount = price.unit_amount || 0;
        updateData.currency = price.currency;
        updateData.interval = price.recurring?.interval || 'month';
        updateData.intervalCount = price.recurring?.interval_count || 1;
      }

      // Update payment method if provided
      if (dto.paymentMethodId) {
        await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          default_payment_method: dto.paymentMethodId,
        });
      }

      // Update metadata if provided
      if (dto.metadata) {
        updateData.metadata = { ...subscription.metadata, ...dto.metadata };
      }

      const updatedSubscription = await this.subscriptionModel.findByIdAndUpdate(
        subscription._id as any,
        updateData,
        { new: true },
      );

      if (!updatedSubscription) {
        throw new DatabaseException('Failed to update subscription');
      }

      this.logger.log(
        `✅ Updated subscription ${subscription.stripeSubscriptionId} for user ${userId}`,
      );

      return this.mapToResponseDto(updatedSubscription);
    } catch (error) {
      this.logger.error(`❌ Failed to update subscription for user ${userId}:`, error);
      if (error instanceof ValidationException || error instanceof NotFoundCustomException) {
        throw error;
      }
      throw new DatabaseException(
        `Failed to update subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    userId: string,
    cancelAtPeriodEnd: boolean = true,
  ): Promise<SubscriptionResponseDto> {
    try {
      this.logger.log(
        `Canceling subscription for user ${userId} (cancelAtPeriodEnd: ${cancelAtPeriodEnd})`,
      );

      const subscription = await this.subscriptionModel.findOne({
        userId,
        status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      });

      if (!subscription) {
        throw new NotFoundCustomException('Active subscription not found for user');
      }

      // Cancel subscription in Stripe
      let stripeSubscription;
      if (cancelAtPeriodEnd) {
        stripeSubscription = await this.stripe.subscriptions.update(
          subscription.stripeSubscriptionId,
          {
            cancel_at_period_end: true,
          },
        );
      } else {
        stripeSubscription = await this.stripe.subscriptions.cancel(
          subscription.stripeSubscriptionId,
        );
      }

      // Update local record
      const updateData: any = {
        status: stripeSubscription.status as SubscriptionStatus,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      };

      if (stripeSubscription.canceled_at) {
        updateData.canceledAt = new Date(stripeSubscription.canceled_at * 1000);
      }

      if (stripeSubscription.ended_at) {
        updateData.endedAt = new Date(stripeSubscription.ended_at * 1000);
      }

      const updatedSubscription = await this.subscriptionModel.findByIdAndUpdate(
        subscription._id,
        updateData,
        { new: true },
      );

      if (!updatedSubscription) {
        throw new DatabaseException('Failed to update subscription');
      }

      // Update user's subscription info
      const userIdNumber = parseInt(userId, 10);
      await this.userService.updateUserSubscriptionInfo(userIdNumber, {
        subscriptionStatus: stripeSubscription.status as string,
        subscriptionEndDate: stripeSubscription.current_period_end
          ? new Date((stripeSubscription.current_period_end as number) * 1000)
          : undefined,
      });

      this.logger.log(
        `✅ Canceled subscription ${subscription.stripeSubscriptionId} for user ${userId}`,
      );

      return this.mapToResponseDto(updatedSubscription);
    } catch (error) {
      this.logger.error(`❌ Failed to cancel subscription for user ${userId}:`, error);
      if (error instanceof NotFoundCustomException) {
        throw error;
      }
      throw new DatabaseException(
        `Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Handle subscription webhooks from Stripe
   */
  async handleSubscriptionWebhook(event: Stripe.Event): Promise<void> {
    this.logger.log(`Processing subscription webhook: ${event.type}`);

    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;
        default:
          this.logger.log(`Unhandled subscription webhook type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error processing subscription webhook ${event.type}:`, error);
      throw error;
    }
  }

  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
    const userId = stripeSubscription.metadata?.userId;
    if (!userId) {
      this.logger.warn(`No userId in subscription metadata: ${stripeSubscription.id}`);
      return;
    }

    this.logger.log(`Updating subscription ${stripeSubscription.id} for user ${userId}`);

    const updateData: Partial<Subscription> = {
      status: (stripeSubscription as any).status as SubscriptionStatus,
      currentPeriodStart: new Date(
        ((stripeSubscription as any).current_period_start as number) * 1000,
      ),
      currentPeriodEnd: new Date(((stripeSubscription as any).current_period_end as number) * 1000),
      cancelAtPeriodEnd: (stripeSubscription as any).cancel_at_period_end as boolean,
    };

    if ((stripeSubscription as any).trial_end) {
      updateData.trialEnd = new Date(((stripeSubscription as any).trial_end as number) * 1000);
    }

    if ((stripeSubscription as any).canceled_at) {
      updateData.canceledAt = new Date(((stripeSubscription as any).canceled_at as number) * 1000);
    }

    if ((stripeSubscription as any).ended_at) {
      updateData.endedAt = new Date(((stripeSubscription as any).ended_at as number) * 1000);
    }

    await this.subscriptionModel.findOneAndUpdate(
      { stripeSubscriptionId: stripeSubscription.id },
      updateData as any,
      { new: true },
    );

    // Update user's subscription info
    const userIdNumber = parseInt(userId, 10);
    if (!isNaN(userIdNumber)) {
      await this.userService.updateUserSubscriptionInfo(userIdNumber, {
        subscriptionStatus: (stripeSubscription as any).status as string,
        subscriptionEndDate: new Date(
          ((stripeSubscription as any).current_period_end as number) * 1000,
        ),
      });
    }
  }

  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
    const userId = stripeSubscription.metadata?.userId;
    if (!userId) {
      this.logger.warn(`No userId in subscription metadata: ${stripeSubscription.id}`);
      return;
    }

    this.logger.log(`Deleting subscription ${stripeSubscription.id} for user ${userId}`);

    await this.subscriptionModel.findOneAndUpdate(
      { stripeSubscriptionId: stripeSubscription.id },
      {
        status: SubscriptionStatus.CANCELED,
        endedAt: new Date(),
      },
      { new: true },
    );

    // Update user's subscription info
    const userIdNumber = parseInt(userId, 10);
    if (!isNaN(userIdNumber)) {
      await this.userService.updateUserSubscriptionInfo(userIdNumber, {
        subscriptionStatus: 'canceled',
        subscriptionEndDate: new Date(),
      });
    }
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    if (!(invoice as any).subscription) return;

    const subscriptionId =
      typeof (invoice as any).subscription === 'string'
        ? (invoice as any).subscription
        : (invoice as any).subscription.id;
    this.logger.log(`Invoice payment succeeded for subscription ${subscriptionId}`);

    // You can add additional logic here for successful payments
    // For example, updating usage limits, sending confirmation emails, etc.
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (!(invoice as any).subscription) return;

    const subscriptionId =
      typeof (invoice as any).subscription === 'string'
        ? (invoice as any).subscription
        : (invoice as any).subscription.id;
    this.logger.log(`Invoice payment failed for subscription ${subscriptionId}`);

    // You can add additional logic here for failed payments
    // For example, sending dunning emails, updating subscription status, etc.
  }

  private mapToResponseDto(
    subscription: Subscription & { createdAt?: Date; updatedAt?: Date },
  ): SubscriptionResponseDto {
    return {
      id: String(subscription._id),
      userId: subscription.userId,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      stripePriceId: subscription.stripePriceId,
      stripeProductId: subscription.stripeProductId,
      productName: subscription.productName,
      priceAmount: subscription.priceAmount,
      currency: subscription.currency,
      interval: subscription.interval,
      intervalCount: subscription.intervalCount,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialEnd: subscription.trialEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      createdAt: subscription.createdAt || new Date(),
      updatedAt: subscription.updatedAt || new Date(),
    };
  }
}
