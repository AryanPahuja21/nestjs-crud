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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from '../../database/schemas/product.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
@UseFilters(HttpExceptionFilter)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, type: Product })
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, type: [Product] })
  findAll() {
    return this.productService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, type: Product })
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @Patch(':id')
  @ApiOperation({ summary: 'Update product by ID' })
  @ApiResponse({ status: 200, type: Product })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete product by ID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
