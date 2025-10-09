import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUser = {
    id: 1,
    name: 'Aryan',
    email: 'aryan@example.com',
    password: '123456',
  };

  const mockUserService = {
    create: jest.fn().mockResolvedValue(mockUser),
    findAll: jest.fn().mockResolvedValue([mockUser]),
    findOne: jest.fn().mockResolvedValue(mockUser),
    update: jest.fn().mockResolvedValue(mockUser),
    remove: jest.fn().mockResolvedValue({ deleted: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a user', async () => {
    const dto: CreateUserDto = { name: 'Aryan', email: 'aryan@example.com', password: '123456' };
    expect(await controller.create(dto)).toEqual(mockUser);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should return all users', async () => {
    expect(await controller.findAll()).toEqual([mockUser]);
  });

  it('should return one user', async () => {
    expect(await controller.findOne(1)).toEqual(mockUser);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('should update a user', async () => {
    const dto: UpdateUserDto = { name: 'Updated' };
    expect(await controller.update(1, dto)).toEqual(mockUser);
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('should delete a user', async () => {
    expect(await controller.remove(1)).toEqual({ deleted: true });
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
