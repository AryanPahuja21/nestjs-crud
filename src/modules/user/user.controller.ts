import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import {
  UserRegistrationResponse,
  UserListResponse,
  UserItemResponse,
  UserDeleteResponse,
  UserUpdateResponse,
  SafeUser,
} from './interfaces/user-responses.interface';
import { buildSuccessResponse, buildDeleteResponse } from '../../utils/response.util';

@ApiTags('Users')
@Controller('users')
@UseFilters(HttpExceptionFilter)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user and return JWT token' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully with JWT token',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        timestamp: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        data: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            access_token: { type: 'string' },
          },
        },
      },
    },
  })
  async create(@Body() dto: CreateUserDto): Promise<UserRegistrationResponse> {
    const user = await this.userService.create(dto);

    // Generate JWT token for the new user
    const payload = {
      username: user.email,
      sub: user.id,
      role: user.role,
    };
    const access_token = this.jwtService.sign(payload);

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return buildSuccessResponse({
      user: userWithoutPassword as SafeUser,
      access_token,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'List of all users',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        timestamp: { type: 'string' },
        data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
      },
    },
  })
  async findAll(): Promise<UserListResponse> {
    const users = await this.userService.findAll();

    // Remove passwords from all users
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const safeUsers = users.map(({ password, ...user }) => user as SafeUser);

    return buildSuccessResponse(safeUsers);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User details',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        timestamp: { type: 'string' },
        data: { $ref: '#/components/schemas/User' },
      },
    },
  })
  async findOne(@Param('id') id: number): Promise<UserItemResponse> {
    const user = await this.userService.findOne(id);

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;

    return buildSuccessResponse(safeUser as SafeUser);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiResponse({
    status: 200,
    description: 'Updated user details',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        timestamp: { type: 'string' },
        data: { $ref: '#/components/schemas/User' },
      },
    },
  })
  async update(@Param('id') id: number, @Body() dto: UpdateUserDto): Promise<UserUpdateResponse> {
    const updatedUser = await this.userService.update(id, dto);

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = updatedUser;

    return buildSuccessResponse(safeUser as SafeUser);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        timestamp: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            deletedId: { type: 'number' },
          },
        },
      },
    },
  })
  async remove(@Param('id') id: number): Promise<UserDeleteResponse> {
    await this.userService.remove(id);

    return buildDeleteResponse('User deleted successfully', id);
  }
}
