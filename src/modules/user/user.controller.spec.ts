import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;
  let jwtService: JwtService;

  const mockUser = {
    id: 1,
    name: 'Aryan',
    email: 'aryan@example.com',
    password: '123456',
  };

  const mockUserWithoutPassword = {
    id: 1,
    name: 'Aryan',
    email: 'aryan@example.com',
  };

  const mockUserService = {
    create: jest.fn().mockResolvedValue(mockUser),
    findAll: jest.fn().mockResolvedValue([mockUser]),
    findOne: jest.fn().mockResolvedValue(mockUser),
    update: jest.fn().mockResolvedValue(mockUser),
    remove: jest.fn().mockResolvedValue({ deleted: true }),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a user and return JWT token', async () => {
    const dto: CreateUserDto = { name: 'Aryan', email: 'aryan@example.com', password: '123456' };
    const result = await controller.create(dto);

    expect(result).toEqual({
      user: mockUserWithoutPassword,
      access_token: 'mock-jwt-token',
    });
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(jwtService.sign).toHaveBeenCalledWith({ username: mockUser.email, sub: mockUser.id });
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
