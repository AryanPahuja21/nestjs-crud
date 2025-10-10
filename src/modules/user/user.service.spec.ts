import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('UserService', () => {
  let service: UserService;

  const mockUser = {
    id: 1,
    name: 'Aryan',
    email: 'test@example.com',
    password: 'hashed-password',
  };

  const mockRepo = {
    create: jest.fn().mockReturnValue(mockUser),
    save: jest.fn().mockResolvedValue(mockUser),
    find: jest.fn().mockResolvedValue([mockUser]),
    findOne: jest.fn(),
    update: jest.fn().mockResolvedValue(mockUser),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup default mock behavior
    mockRepo.findOne.mockResolvedValue(null); // No existing user by default
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a user', async () => {
    const createDto = { name: 'Aryan', email: 'test@example.com', password: '123456' };

    const result = await service.create(createDto);

    expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    expect(mockRepo.create).toHaveBeenCalledWith({
      ...createDto,
      password: 'hashed-password',
    });
    expect(mockRepo.save).toHaveBeenCalled();
    expect(result).toEqual(mockUser);
  });

  it('should find all users', async () => {
    const result = await service.findAll();
    expect(mockRepo.find).toHaveBeenCalled();
    expect(result).toEqual([mockUser]);
  });

  it('should find one user', async () => {
    mockRepo.findOne.mockResolvedValue(mockUser);

    const result = await service.findOne(1);
    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual(mockUser);
  });

  it('should find user by email', async () => {
    mockRepo.findOne.mockResolvedValue(mockUser);

    const result = await service.findByEmail('test@example.com');
    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    expect(result).toEqual(mockUser);
  });

  it('should update a user', async () => {
    mockRepo.findOne.mockResolvedValue(mockUser);

    const updateDto = { name: 'Updated Name' };
    const result = await service.update(1, updateDto);

    expect(mockRepo.update).toHaveBeenCalledWith(1, updateDto);
    expect(result).toEqual(mockUser);
  });

  it('should remove a user', async () => {
    mockRepo.findOne.mockResolvedValue(mockUser);

    await service.remove(1);
    expect(mockRepo.delete).toHaveBeenCalledWith(1);
  });
});
