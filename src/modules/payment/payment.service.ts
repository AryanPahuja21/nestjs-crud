import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment, PaymentStatus } from '../../database/schemas/payment.schema';
import { Product } from '../../database/schemas/product.schema';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { NotFoundCustomException } from '../../common/exceptions/not-found.exception';
import { ValidationException } from '../../common/exceptions/validation.exception';
import { DatabaseException } from '../../common/exceptions/database.exception';
import { UserService } from '../user/user.service';

@Injectable()
export class PaymentService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    private configService: ConfigService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    if (!secretKey) {
      throw new Error('Stripe secret key is required');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-09-30.clover',
    });
  }

  async createPaymentIntent(
    userId: string,
    dto: CreatePaymentIntentDto,
  ): Promise<{
    clientSecret: string;
    paymentIntentId: string;
    payment: Payment;
  }> {
    try {
      // Find the product
      const product = await this.productModel.findById(dto.productId);
      if (!product) {
        throw new NotFoundCustomException('Product', dto.productId);
      }

      // Check stock availability
      if (product.stockQuantity < dto.quantity) {
        throw new ValidationException('Insufficient stock available');
      }

      // Calculate total amount (in cents)
      const amount = Math.round(product.price * dto.quantity * 100);

      // Get user and their Stripe customer
      const userIdNumber = parseInt(userId, 10);
      if (isNaN(userIdNumber) || userIdNumber <= 0) {
        throw new ValidationException(`Invalid user ID: ${userId}`);
      }

      this.logger.log(`Creating payment intent for user ${userIdNumber} (${userId})`);
      const user = await this.userService.findOne(userIdNumber);
      let stripeCustomerId = user.stripeCustomerId;

      // If user doesn't have a Stripe customer, create one
      if (!stripeCustomerId) {
        this.logger.log(`User ${userId} doesn't have Stripe customer, creating one...`);
        stripeCustomerId = await this.userService.createStripeCustomerForUser(user.id);
      }

      // Create payment intent in Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: dto.currency || 'usd',
        customer: stripeCustomerId,
        metadata: {
          userId,
          productId: dto.productId,
          quantity: dto.quantity.toString(),
          ...dto.metadata,
        },
        receipt_email: dto.receiptEmail,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Save payment record to database
      const payment = new this.paymentModel({
        userId: new Types.ObjectId(userId),
        productId: new Types.ObjectId(dto.productId),
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: stripeCustomerId,
        amount,
        currency: dto.currency || 'usd',
        status: PaymentStatus.PENDING,
        description: `Payment for ${product.name} (Qty: ${dto.quantity})`,
        receiptEmail: dto.receiptEmail,
        metadata: dto.metadata,
      });

      const savedPayment = await payment.save();

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
        payment: savedPayment,
      };
    } catch (error) {
      this.logger.error('Failed to create payment intent', error);
      if (error instanceof NotFoundCustomException || error instanceof ValidationException) {
        throw error;
      }
      throw new DatabaseException('Failed to create payment intent', 'createPaymentIntent');
    }
  }

  async confirmPayment(dto: ConfirmPaymentDto): Promise<Payment> {
    try {
      // Find the payment record
      const payment = await this.paymentModel.findOne({
        stripePaymentIntentId: dto.paymentIntentId,
      });

      if (!payment) {
        throw new NotFoundCustomException('Payment', dto.paymentIntentId);
      }

      // Confirm the payment intent with Stripe
      const paymentIntent = await this.stripe.paymentIntents.confirm(dto.paymentIntentId, {
        payment_method: dto.paymentMethodId,
      });

      // Update payment status based on Stripe response
      payment.status = this.mapStripeStatusToPaymentStatus(paymentIntent.status);
      if (paymentIntent.status === 'succeeded') {
        payment.paidAt = new Date();
        payment.paymentMethodDetails = { paymentMethods: paymentIntent.payment_method_types || [] };

        // Update product stock
        await this.updateProductStock(payment.productId.toString(), 1);
      }

      return await payment.save();
    } catch (error) {
      this.logger.error('Failed to confirm payment', error);
      if (error instanceof NotFoundCustomException) {
        throw error;
      }
      throw new DatabaseException('Failed to confirm payment', 'confirmPayment');
    }
  }

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    try {
      return await this.paymentModel
        .find({ userId: new Types.ObjectId(userId) })
        .populate('productId')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      this.logger.error('Failed to retrieve user payments', error);
      throw new DatabaseException('Failed to retrieve payments', 'getPaymentsByUser');
    }
  }

  async getPaymentById(paymentId: string): Promise<Payment> {
    try {
      const payment = await this.paymentModel.findById(paymentId).populate('productId').exec();

      if (!payment) {
        throw new NotFoundCustomException('Payment', paymentId);
      }

      return payment;
    } catch (error) {
      if (error instanceof NotFoundCustomException) {
        throw error;
      }
      this.logger.error('Failed to retrieve payment', error);
      throw new DatabaseException('Failed to retrieve payment', 'getPaymentById');
    }
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      this.logger.log(`Processing webhook event: ${event.type} (${event.id})`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        case 'payment_intent.created':
          await this.handlePaymentIntentCreated(event.data.object);
          break;
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      this.logger.log(`✅ Successfully processed webhook: ${event.type} (${event.id})`);
    } catch (error) {
      this.logger.error(`❌ Failed to handle webhook ${event.type} (${event.id}):`, error);
      throw error;
    }
  }

  async createStripeCustomer(
    userId: string,
    email: string,
    name: string,
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
          source: 'user_registration',
        },
        description: `Customer for user ID: ${userId}`,
      });

      this.logger.log(`Created Stripe customer ${customer.id} for user ${userId}`);
      return customer;
    } catch (error) {
      this.logger.error('Failed to create Stripe customer', error);
      throw new DatabaseException('Failed to create customer', 'createStripeCustomer');
    }
  }

  async getStripeCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        throw new NotFoundCustomException('Customer', customerId);
      }
      return customer as Stripe.Customer;
    } catch (error) {
      this.logger.error('Failed to retrieve Stripe customer', error);
      if (error instanceof NotFoundCustomException) {
        throw error;
      }
      throw new DatabaseException('Failed to retrieve customer', 'getStripeCustomer');
    }
  }

  async updateStripeCustomer(
    customerId: string,
    updates: { email?: string; name?: string; metadata?: Record<string, string> },
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.update(customerId, updates);
      this.logger.log(`Updated Stripe customer ${customerId}`);
      return customer;
    } catch (error) {
      this.logger.error('Failed to update Stripe customer', error);
      throw new DatabaseException('Failed to update customer', 'updateStripeCustomer');
    }
  }

  async deleteStripeCustomer(customerId: string): Promise<void> {
    try {
      await this.stripe.customers.del(customerId);
      this.logger.log(`Deleted Stripe customer ${customerId}`);
    } catch (error) {
      this.logger.error('Failed to delete Stripe customer', error);
      throw new DatabaseException('Failed to delete customer', 'deleteStripeCustomer');
    }
  }

  async attachPaymentMethod(
    customerId: string,
    paymentMethodId: string,
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      this.logger.log(`Attached payment method ${paymentMethodId} to customer ${customerId}`);
      return paymentMethod;
    } catch (error) {
      this.logger.error('Failed to attach payment method', error);
      throw new DatabaseException('Failed to attach payment method', 'attachPaymentMethod');
    }
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId);
      this.logger.log(`Detached payment method ${paymentMethodId}`);
      return paymentMethod;
    } catch (error) {
      this.logger.error('Failed to detach payment method', error);
      throw new DatabaseException('Failed to detach payment method', 'detachPaymentMethod');
    }
  }

  async getCustomerPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      return paymentMethods.data;
    } catch (error) {
      this.logger.error('Failed to retrieve customer payment methods', error);
      throw new DatabaseException(
        'Failed to retrieve payment methods',
        'getCustomerPaymentMethods',
      );
    }
  }

  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string,
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      this.logger.log(`Set default payment method ${paymentMethodId} for customer ${customerId}`);
      return customer;
    } catch (error) {
      this.logger.error('Failed to set default payment method', error);
      throw new DatabaseException(
        'Failed to set default payment method',
        'setDefaultPaymentMethod',
      );
    }
  }

  private async getOrCreateStripeCustomer(userId: string): Promise<Stripe.Customer> {
    // This method is now deprecated in favor of the new customer management methods
    // It's kept for backward compatibility with existing payment flows
    try {
      const customer = await this.stripe.customers.create({
        metadata: { userId },
      });
      return customer;
    } catch (error) {
      this.logger.error('Failed to create Stripe customer', error);
      throw new DatabaseException('Failed to create customer', 'getOrCreateStripeCustomer');
    }
  }

  private async updateProductStock(productId: string, quantity: number): Promise<void> {
    try {
      await this.productModel.findByIdAndUpdate(
        productId,
        { $inc: { stockQuantity: -quantity } },
        { new: true },
      );
    } catch (error) {
      this.logger.error('Failed to update product stock', error);
      // Don't throw here to avoid disrupting payment flow
    }
  }

  private mapStripeStatusToPaymentStatus(stripeStatus: string): PaymentStatus {
    switch (stripeStatus) {
      case 'succeeded':
        return PaymentStatus.SUCCEEDED;
      case 'processing':
        return PaymentStatus.PROCESSING;
      case 'requires_action':
        return PaymentStatus.REQUIRES_ACTION;
      case 'canceled':
        return PaymentStatus.CANCELED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.log(`Processing payment success for intent: ${paymentIntent.id}`);

    const payment = await this.paymentModel.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });

    if (!payment) {
      this.logger.warn(`Payment not found for intent: ${paymentIntent.id}`);
      return;
    }

    try {
      payment.status = PaymentStatus.SUCCEEDED;
      payment.paidAt = new Date();
      payment.paymentMethodDetails = { paymentMethods: paymentIntent.payment_method_types || [] };
      await payment.save();

      this.logger.log(`✅ Updated payment ${String(payment._id)} status to SUCCEEDED`);

      // Update product stock if not already done
      if (payment.metadata?.quantity) {
        await this.updateProductStock(
          payment.productId.toString(),
          parseInt(payment.metadata.quantity as string),
        );
        this.logger.log(`✅ Updated product stock for ${String(payment.productId)}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to update payment ${String(payment._id)}:`,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.log(`Processing payment failure for intent: ${paymentIntent.id}`);

    const payment = await this.paymentModel.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });

    if (!payment) {
      this.logger.warn(`Payment not found for intent: ${paymentIntent.id}`);
      return;
    }

    try {
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
      await payment.save();

      this.logger.log(`✅ Updated payment ${String(payment._id)} status to FAILED`);
    } catch (error) {
      this.logger.error(
        `Failed to update payment ${String(payment._id)}:`,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  private async handlePaymentIntentCreated(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.log(
      `Payment intent created: ${paymentIntent.id} for amount: ${paymentIntent.amount}`,
    );
  }
}
