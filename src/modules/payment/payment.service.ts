import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment, PaymentStatus } from '../../database/schemas/payment.schema';
import { Product } from '../../database/schemas/product.schema';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { NotFoundCustomException } from '../../common/exceptions/not-found.exception';
import { ValidationException } from '../../common/exceptions/validation.exception';
import { DatabaseException } from '../../common/exceptions/database.exception';

@Injectable()
export class PaymentService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    private configService: ConfigService,
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

      // Create or get Stripe customer
      const customer = await this.getOrCreateStripeCustomer(userId);

      // Create payment intent in Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: dto.currency || 'usd',
        customer: customer.id,
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
        userId,
        productId: dto.productId,
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: customer.id,
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
        .find({ userId })
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
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error('Failed to handle webhook', error);
      throw error;
    }
  }

  private async getOrCreateStripeCustomer(userId: string): Promise<Stripe.Customer> {
    // This would typically fetch user details from your user service
    // For now, we'll create a simple customer
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
    const payment = await this.paymentModel.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });

    if (payment) {
      payment.status = PaymentStatus.SUCCEEDED;
      payment.paidAt = new Date();
      payment.paymentMethodDetails = { paymentMethods: paymentIntent.payment_method_types || [] };
      await payment.save();

      // Update product stock if not already done
      if (payment.metadata?.quantity) {
        await this.updateProductStock(
          payment.productId.toString(),
          parseInt(payment.metadata.quantity as string),
        );
      }
    }
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment = await this.paymentModel.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });

    if (payment) {
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
      await payment.save();
    }
  }
}
