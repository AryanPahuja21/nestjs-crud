import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Laptop' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'High performance laptop' })
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1200 })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 'Electronics' })
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 10 })
  @IsOptional()
  stockQuantity?: number;
}
