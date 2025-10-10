import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { RedisService } from '../redis/redis.service';
import {
  ProductListResponse,
  ProductItemResponse,
  ProductCreateResponse,
  ProductUpdateResponse,
  ProductDeleteResponse,
} from './interfaces/product-responses.interface';
import { buildSuccessResponse, buildDeleteResponse } from '../../utils/response.util';
import { Product } from '../../database/schemas/product.schema';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
@UseFilters(HttpExceptionFilter)
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly redisService: RedisService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        timestamp: { type: 'string' },
        data: { $ref: '#/components/schemas/Product' },
      },
    },
  })
  async create(@Body() dto: CreateProductDto): Promise<ProductCreateResponse> {
    const product = await this.productService.create(dto);

    // Invalidate products list cache when new product is created
    await this.redisService.del('products:all');

    return buildSuccessResponse(product);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  @CacheKey('products:all')
  @CacheTTL(600) // 10 minutes - products change less frequently
  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({
    status: 200,
    description: 'List of all products',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        timestamp: { type: 'string' },
        data: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
      },
    },
  })
  async findAll(): Promise<ProductListResponse> {
    const products = await this.productService.findAll();
    return buildSuccessResponse(products);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(900) // 15 minutes - individual products cached longer
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({
    status: 200,
    description: 'Product details',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        timestamp: { type: 'string' },
        data: { $ref: '#/components/schemas/Product' },
      },
    },
  })
  async findOne(@Param('id') id: string): Promise<ProductItemResponse> {
    const cacheKey = `products:${id}`;

    // Try to get from cache first
    const cachedProduct = await this.redisService.get<Product>(cacheKey);
    if (cachedProduct) {
      return buildSuccessResponse(cachedProduct);
    }

    const product = await this.productService.findOne(id);

    // Cache the product data
    await this.redisService.set(cacheKey, product, 900);

    return buildSuccessResponse(product);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @Patch(':id')
  @ApiOperation({ summary: 'Update product by ID' })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        timestamp: { type: 'string' },
        data: { $ref: '#/components/schemas/Product' },
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductUpdateResponse> {
    const updatedProduct = await this.productService.update(id, dto);

    // Invalidate related caches
    await this.redisService.del(`products:${id}`);
    await this.redisService.del('products:all');

    return buildSuccessResponse(updatedProduct);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete product by ID' })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        timestamp: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            deletedId: { type: 'string' },
          },
        },
      },
    },
  })
  async remove(@Param('id') id: string): Promise<ProductDeleteResponse> {
    await this.productService.remove(id);

    // Invalidate related caches
    await this.redisService.del(`products:${id}`);
    await this.redisService.del('products:all');

    return buildDeleteResponse('Product deleted successfully', id);
  }
}
