import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SetDefaultPaymentMethodDto {
  @ApiProperty({
    description: 'Stripe Payment Method ID to set as default',
    example: 'pm_1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;
}
