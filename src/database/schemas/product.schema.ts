import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class Product extends Document {
  @ApiProperty({ example: 'Laptop', description: 'Product name' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ example: 'High-end gaming laptop', description: 'Description' })
  @Prop()
  description: string;

  @ApiProperty({ example: 1200, description: 'Product price' })
  @Prop({ required: true })
  price: number;

  @ApiProperty({ example: 'Electronics', description: 'Product category' })
  @Prop()
  category: string;

  @ApiProperty({ example: 10, description: 'Available stock quantity' })
  @Prop({ default: 0 })
  stockQuantity: number;

  @ApiProperty({ example: 'price_1234567890', description: 'Stripe Price ID' })
  @Prop()
  stripePriceId?: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
