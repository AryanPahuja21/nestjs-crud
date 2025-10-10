import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../../database/schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { NotFoundCustomException } from '../../common/exceptions/not-found.exception';
import { ValidationException } from '../../common/exceptions/validation.exception';
import { DatabaseException } from '../../common/exceptions/database.exception';

@Injectable()
export class ProductService {
  constructor(@InjectModel(Product.name) private productModel: Model<Product>) {}

  async create(dto: CreateProductDto): Promise<Product> {
    if (!dto.name || !dto.price) {
      throw new ValidationException('Product name and price are required');
    }

    if (dto.price <= 0) {
      throw new ValidationException('Product price must be greater than zero');
    }

    try {
      return await this.productModel.create(dto);
    } catch {
      throw new DatabaseException('Failed to create product', 'create');
    }
  }

  async findAll(): Promise<Product[]> {
    try {
      return await this.productModel.find().exec();
    } catch {
      throw new DatabaseException('Failed to retrieve products', 'findAll');
    }
  }

  async findOne(id: string): Promise<Product> {
    if (!id) {
      throw new ValidationException('Product ID is required');
    }

    try {
      const product = await this.productModel.findById(id).exec();
      if (!product) {
        throw new NotFoundCustomException('Product', id);
      }
      return product;
    } catch (error) {
      if (error instanceof NotFoundCustomException || error instanceof ValidationException) {
        throw error;
      }
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        (error as { name: string }).name === 'CastError'
      ) {
        throw new ValidationException('Invalid product ID format');
      }
      throw new DatabaseException('Failed to find product', 'findOne');
    }
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    if (!id) {
      throw new ValidationException('Product ID is required');
    }

    if (dto.price !== undefined && dto.price <= 0) {
      throw new ValidationException('Product price must be greater than zero');
    }

    try {
      const product = await this.productModel.findByIdAndUpdate(id, dto, { new: true });
      if (!product) {
        throw new NotFoundCustomException('Product', id);
      }
      return product;
    } catch (error) {
      if (error instanceof NotFoundCustomException || error instanceof ValidationException) {
        throw error;
      }
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        (error as { name: string }).name === 'CastError'
      ) {
        throw new ValidationException('Invalid product ID format');
      }
      throw new DatabaseException('Failed to update product', 'update');
    }
  }

  async remove(id: string): Promise<void> {
    if (!id) {
      throw new ValidationException('Product ID is required');
    }

    try {
      const result = await this.productModel.findByIdAndDelete(id);
      if (!result) {
        throw new NotFoundCustomException('Product', id);
      }
    } catch (error) {
      if (error instanceof NotFoundCustomException || error instanceof ValidationException) {
        throw error;
      }
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        (error as { name: string }).name === 'CastError'
      ) {
        throw new ValidationException('Invalid product ID format');
      }
      throw new DatabaseException('Failed to delete product', 'remove');
    }
  }
}
