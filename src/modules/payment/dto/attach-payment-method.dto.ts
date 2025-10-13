import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AttachPaymentMethodDto {
  @ApiProperty({
    description: 'Stripe Payment Method ID to attach to the customer',
    example: 'pm_1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;
}
