import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEmail, Min } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({ example: '60d0fe4f5311236168a109cb', description: 'Product ID' })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({ example: 1, description: 'Quantity of items' })
  @IsNumber()
  @Min(1)
  quantity: number = 1;

  @ApiProperty({ example: 'usd', description: 'Currency code' })
  @IsOptional()
  @IsString()
  currency?: string = 'usd';

  @ApiProperty({ example: 'user@example.com', description: 'Receipt email' })
  @IsOptional()
  @IsEmail()
  receiptEmail?: string;

  @ApiProperty({ example: { orderId: '12345' }, description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}
