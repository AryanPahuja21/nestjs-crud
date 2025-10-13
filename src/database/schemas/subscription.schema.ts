import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  PAST_DUE = 'past_due',
  PAUSED = 'paused',
  TRIALING = 'trialing',
  UNPAID = 'unpaid',
}

export enum SubscriptionInterval {
  MONTH = 'month',
  YEAR = 'year',
  WEEK = 'week',
  DAY = 'day',
}

@Schema({ timestamps: true })
export class Subscription extends Document {
  @ApiProperty({ example: '123', description: 'User ID from MySQL' })
  @Prop({ type: String, required: true })
  userId: string;

  @ApiProperty({ example: 'sub_1234567890', description: 'Stripe Subscription ID' })
  @Prop({ required: true, unique: true })
  stripeSubscriptionId: string;

  @ApiProperty({ example: 'cus_1234567890', description: 'Stripe Customer ID' })
  @Prop({ required: true })
  stripeCustomerId: string;

  @ApiProperty({ example: 'price_1234567890', description: 'Stripe Price ID' })
  @Prop({ required: true })
  stripePriceId: string;

  @ApiProperty({ example: 'prod_1234567890', description: 'Stripe Product ID' })
  @Prop({ required: true })
  stripeProductId: string;

  @ApiProperty({ example: 'Premium Plan', description: 'Product name' })
  @Prop({ required: true })
  productName: string;

  @ApiProperty({ example: 2999, description: 'Price in cents' })
  @Prop({ required: true })
  priceAmount: number;

  @ApiProperty({ example: 'usd', description: 'Currency code' })
  @Prop({ required: true, default: 'usd' })
  currency: string;

  @ApiProperty({ example: SubscriptionInterval.MONTH, enum: SubscriptionInterval })
  @Prop({ type: String, enum: SubscriptionInterval, required: true })
  interval: SubscriptionInterval;

  @ApiProperty({ example: 1, description: 'Interval count' })
  @Prop({ default: 1 })
  intervalCount: number;

  @ApiProperty({ example: SubscriptionStatus.ACTIVE, enum: SubscriptionStatus })
  @Prop({ type: String, enum: SubscriptionStatus, default: SubscriptionStatus.INCOMPLETE })
  status: SubscriptionStatus;

  @ApiProperty({ example: '2023-12-01T10:00:00Z', description: 'Current period start' })
  @Prop()
  currentPeriodStart?: Date;

  @ApiProperty({ example: '2024-01-01T10:00:00Z', description: 'Current period end' })
  @Prop()
  currentPeriodEnd?: Date;

  @ApiProperty({ example: '2024-01-01T10:00:00Z', description: 'Trial end date' })
  @Prop()
  trialEnd?: Date;

  @ApiProperty({ example: '2024-01-01T10:00:00Z', description: 'Cancellation date' })
  @Prop()
  canceledAt?: Date;

  @ApiProperty({ example: '2024-01-01T10:00:00Z', description: 'End of subscription' })
  @Prop()
  endedAt?: Date;

  @ApiProperty({ example: false, description: 'Cancel at period end' })
  @Prop({ default: false })
  cancelAtPeriodEnd: boolean;

  @ApiProperty({ example: { feature1: true }, description: 'Additional metadata' })
  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
