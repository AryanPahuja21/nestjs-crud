import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled',
  PROCESSING = 'processing',
  REQUIRES_ACTION = 'requires_action',
}

export enum PaymentType {
  ONE_TIME = 'one_time',
  SUBSCRIPTION = 'subscription',
}

@Schema({ timestamps: true })
export class Payment extends Document {
  @ApiProperty({ example: '60d0fe4f5311236168a109ca', description: 'User ID' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @ApiProperty({ example: '60d0fe4f5311236168a109cb', description: 'Product ID' })
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @ApiProperty({ example: 'pi_1234567890', description: 'Stripe Payment Intent ID' })
  @Prop({ required: true, unique: true })
  stripePaymentIntentId: string;

  @ApiProperty({ example: 'cus_1234567890', description: 'Stripe Customer ID' })
  @Prop({ required: true })
  stripeCustomerId: string;

  @ApiProperty({ example: 2999, description: 'Amount in cents' })
  @Prop({ required: true })
  amount: number;

  @ApiProperty({ example: 'usd', description: 'Currency code' })
  @Prop({ required: true, default: 'usd' })
  currency: string;

  @ApiProperty({ example: PaymentStatus.SUCCEEDED, enum: PaymentStatus })
  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @ApiProperty({ example: PaymentType.ONE_TIME, enum: PaymentType })
  @Prop({ type: String, enum: PaymentType, default: PaymentType.ONE_TIME })
  type: PaymentType;

  @ApiProperty({ example: 'Payment for Laptop', description: 'Payment description' })
  @Prop()
  description?: string;

  @ApiProperty({ example: { card: '4242' }, description: 'Payment method details' })
  @Prop({ type: Object })
  paymentMethodDetails?: Record<string, any>;

  @ApiProperty({ example: 'Receipt for your purchase', description: 'Receipt email' })
  @Prop()
  receiptEmail?: string;

  @ApiProperty({ example: '2023-12-01T10:00:00Z', description: 'Payment processed at' })
  @Prop()
  paidAt?: Date;

  @ApiProperty({ example: 'Insufficient funds', description: 'Failure reason if payment failed' })
  @Prop()
  failureReason?: string;

  @ApiProperty({ example: { metadata: 'additional data' }, description: 'Additional metadata' })
  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
