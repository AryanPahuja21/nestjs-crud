import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmPaymentDto {
  @ApiProperty({ example: 'pi_1234567890', description: 'Stripe Payment Intent ID' })
  @IsNotEmpty()
  @IsString()
  paymentIntentId: string;

  @ApiProperty({ example: 'pm_1234567890', description: 'Stripe Payment Method ID' })
  @IsNotEmpty()
  @IsString()
  paymentMethodId: string;
}
