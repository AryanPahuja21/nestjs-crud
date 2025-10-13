import { ApiProperty } from '@nestjs/swagger';
import {
  SubscriptionStatus,
  SubscriptionInterval,
} from '../../../database/schemas/subscription.schema';

export class SubscriptionResponseDto {
  @ApiProperty({ example: '60d0fe4f5311236168a109cb', description: 'Subscription ID' })
  id: string;

  @ApiProperty({ example: '123', description: 'User ID' })
  userId: string;

  @ApiProperty({ example: 'sub_1234567890', description: 'Stripe Subscription ID' })
  stripeSubscriptionId: string;

  @ApiProperty({ example: 'price_1234567890', description: 'Stripe Price ID' })
  stripePriceId: string;

  @ApiProperty({ example: 'prod_1234567890', description: 'Stripe Product ID' })
  stripeProductId: string;

  @ApiProperty({ example: 'Premium Plan', description: 'Product name' })
  productName: string;

  @ApiProperty({ example: 2999, description: 'Price in cents' })
  priceAmount: number;

  @ApiProperty({ example: 'usd', description: 'Currency code' })
  currency: string;

  @ApiProperty({ example: SubscriptionInterval.MONTH, enum: SubscriptionInterval })
  interval: SubscriptionInterval;

  @ApiProperty({ example: 1, description: 'Interval count' })
  intervalCount: number;

  @ApiProperty({ example: SubscriptionStatus.ACTIVE, enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @ApiProperty({ example: '2023-12-01T10:00:00Z', description: 'Current period start' })
  currentPeriodStart?: Date;

  @ApiProperty({ example: '2024-01-01T10:00:00Z', description: 'Current period end' })
  currentPeriodEnd?: Date;

  @ApiProperty({ example: '2024-01-01T10:00:00Z', description: 'Trial end date' })
  trialEnd?: Date;

  @ApiProperty({ example: false, description: 'Cancel at period end' })
  cancelAtPeriodEnd: boolean;

  @ApiProperty({ example: '2023-12-01T10:00:00Z', description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ example: '2023-12-01T10:00:00Z', description: 'Updated at' })
  updatedAt: Date;
}

export class SubscriptionPlansResponseDto {
  @ApiProperty({ example: 'prod_1234567890', description: 'Stripe Product ID' })
  id: string;

  @ApiProperty({ example: 'Premium Plan', description: 'Product name' })
  name: string;

  @ApiProperty({ example: 'Get access to premium features', description: 'Product description' })
  description?: string;

  @ApiProperty({
    type: [Object],
    description: 'Available prices for this product',
    example: [
      {
        id: 'price_1234567890',
        unit_amount: 2999,
        currency: 'usd',
        recurring: {
          interval: 'month',
          interval_count: 1,
        },
      },
    ],
  })
  prices: any[];
}
