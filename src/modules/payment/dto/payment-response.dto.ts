import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus, PaymentType } from '../../../database/schemas/payment.schema';

export class PaymentResponseDto {
  @ApiProperty({ example: '60d0fe4f5311236168a109ca', description: 'Payment ID' })
  id: string;

  @ApiProperty({ example: '60d0fe4f5311236168a109ca', description: 'User ID' })
  userId: string;

  @ApiProperty({ example: '60d0fe4f5311236168a109cb', description: 'Product ID' })
  productId: string;

  @ApiProperty({ example: 'pi_1234567890', description: 'Stripe Payment Intent ID' })
  stripePaymentIntentId: string;

  @ApiProperty({ example: 2999, description: 'Amount in cents' })
  amount: number;

  @ApiProperty({ example: 'usd', description: 'Currency code' })
  currency: string;

  @ApiProperty({ example: PaymentStatus.SUCCEEDED, enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty({ example: PaymentType.ONE_TIME, enum: PaymentType })
  type: PaymentType;

  @ApiProperty({ example: 'Payment for Laptop', description: 'Payment description' })
  description?: string;

  @ApiProperty({ example: '2023-12-01T10:00:00Z', description: 'Payment processed at' })
  paidAt?: Date;

  @ApiProperty({ example: '2023-12-01T10:00:00Z', description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ example: '2023-12-01T10:00:00Z', description: 'Updated at' })
  updatedAt: Date;
}
