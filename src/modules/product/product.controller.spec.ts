import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

describe('ProductController', () => {
  let controller: ProductController;
  let service: ProductService;

  const mockProduct = {
    _id: 'abc123',
    name: 'Laptop',
    description: 'Gaming laptop',
    price: 1000,
    category: 'Electronics',
  };

  const mockProductService = {
    create: jest.fn().mockResolvedValue(mockProduct),
    findAll: jest.fn().mockResolvedValue([mockProduct]),
    findOne: jest.fn().mockResolvedValue(mockProduct),
    update: jest.fn().mockResolvedValue(mockProduct),
    remove: jest.fn().mockResolvedValue({ deleted: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [{ provide: ProductService, useValue: mockProductService }],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a product', async () => {
    const dto: CreateProductDto = {
      name: 'Laptop',
      description: 'Gaming laptop',
      price: 1000,
      category: 'Electronics',
      stockQuantity: 10,
    };
    expect(await controller.create(dto)).toEqual(mockProduct);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should get all products', async () => {
    expect(await controller.findAll()).toEqual([mockProduct]);
  });

  it('should get one product', async () => {
    expect(await controller.findOne('abc123')).toEqual(mockProduct);
  });

  it('should update a product', async () => {
    const dto: UpdateProductDto = { name: 'Updated Laptop' };
    expect(await controller.update('abc123', dto)).toEqual(mockProduct);
    expect(service.update).toHaveBeenCalledWith('abc123', dto);
  });

  it('should delete a product', async () => {
    expect(await controller.remove('abc123')).toEqual({ deleted: true });
    expect(service.remove).toHaveBeenCalledWith('abc123');
  });
});
