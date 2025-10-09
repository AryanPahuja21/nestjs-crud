import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';

describe('UserService', () => {
  let service: UserService;
  let repo: Repository<User>;

  const mockUser = { id: 1, name: 'Aryan', email: 'aryan@example.com', password: '123456' };

  const mockRepo = {
    create: jest.fn().mockReturnValue(mockUser),
    save: jest.fn().mockResolvedValue(mockUser),
    find: jest.fn().mockResolvedValue([mockUser]),
    findOne: jest.fn().mockResolvedValue(mockUser),
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
    repo = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a user', async () => {
    const result = await service.create(mockUser);
    expect(repo.create).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual(mockUser);
  });

  it('should find all users', async () => {
    const result = await service.findAll();
    expect(result).toEqual([mockUser]);
  });

  it('should find one user', async () => {
    const result = await service.findOne(1);
    expect(result).toEqual(mockUser);
  });

  it('should update a user', async () => {
    const result = await service.update(1, mockUser);
    expect(result).toEqual(mockUser);
  });

  it('should remove a user', async () => {
    await service.remove(1);
    expect(repo.delete).toHaveBeenCalledWith(1);
  });
});
