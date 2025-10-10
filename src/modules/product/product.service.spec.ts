import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { getModelToken } from '@nestjs/mongoose';
import { Product } from '../../database/schemas/product.schema';

describe('ProductService', () => {
  let service: ProductService;
  let model: any;

  const mockProduct = {
    _id: 'abc123',
    name: 'Laptop',
    description: 'Gaming laptop',
    price: 1000,
    category: 'Electronics',
  };

  const mockModel = {
    create: jest.fn().mockResolvedValue(mockProduct),
    find: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([mockProduct]),
    }),
    findById: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProduct),
    }),
    findByIdAndUpdate: jest.fn().mockResolvedValue(mockProduct),
    findByIdAndDelete: jest.fn().mockResolvedValue(mockProduct),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductService, { provide: getModelToken(Product.name), useValue: mockModel }],
    }).compile();

    service = module.get<ProductService>(ProductService);
    model = module.get(getModelToken(Product.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a product', async () => {
    const result = await service.create(mockProduct);
    expect(model.create).toHaveBeenCalledWith(mockProduct);
    expect(result).toEqual(mockProduct);
  });

  it('should find all products', async () => {
    const result = await service.findAll();
    expect(result).toEqual([mockProduct]);
  });

  it('should find one product by id', async () => {
    const result = await service.findOne('abc123');
    expect(result).toEqual(mockProduct);
  });

  it('should update a product', async () => {
    const result = await service.update('abc123', mockProduct);
    expect(result).toEqual(mockProduct);
  });

  it('should remove a product', async () => {
    await service.remove('abc123');
    expect(model.findByIdAndDelete).toHaveBeenCalledWith('abc123');
  });
});
