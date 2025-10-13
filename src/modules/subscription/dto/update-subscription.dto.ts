import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSubscriptionDto {
  @ApiProperty({
    example: 'price_1234567890',
    description: 'New Stripe Price ID to switch to',
    required: false,
  })
  @IsOptional()
  @IsString()
  priceId?: string;

  @ApiProperty({
    example: 'pm_1234567890',
    description: 'Payment method ID to use for the subscription',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiProperty({
    example: { orderId: '12345' },
    description: 'Additional metadata for the subscription',
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
