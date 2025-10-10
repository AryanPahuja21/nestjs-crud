import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { User } from '../../database/entities/user.entity'
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundCustomException } from '../../common/exceptions/not-found.exception';
import { DuplicateResourceException } from '../../common/exceptions/duplicate-resource.exception';
import { ValidationException } from '../../common/exceptions/validation.exception';
import { DatabaseException } from '../../common/exceptions/database.exception';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    if (!dto.email || !dto.password) {
      throw new ValidationException('Email and password are required');
    }

    try {
      // Check if user already exists
      const existingUser = await this.userRepo.findOne({ where: { email: dto.email } });
      if (existingUser) {
        throw new DuplicateResourceException('User', 'email', dto.email);
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const user = this.userRepo.create({
        ...dto,
        password: hashedPassword,
      });
      return await this.userRepo.save(user);
    } catch (error) {
      if (error instanceof DuplicateResourceException || error instanceof ValidationException) {
        throw error;
      }
      if (error instanceof QueryFailedError && error.message.includes('duplicate')) {
        throw new DuplicateResourceException('User', 'email', dto.email);
      }
      throw new DatabaseException('Failed to create user', 'create');
    }
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  async findOne(id: number): Promise<User> {
    if (!id || id <= 0) {
      throw new ValidationException('Valid user ID is required');
    }

    try {
      const user = await this.userRepo.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundCustomException('User', id);
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundCustomException || error instanceof ValidationException) {
        throw error;
      }
      throw new DatabaseException('Failed to find user', 'findOne');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    if (!id || id <= 0) {
      throw new ValidationException('Valid user ID is required');
    }

    try {
      await this.findOne(id); // This will throw if user doesn't exist
      
      const updateData = { ...dto };
      if (dto.password) {
        updateData.password = await bcrypt.hash(dto.password, 10);
      }
      
      // Check for email uniqueness if email is being updated
      if (dto.email) {
        const existingUser = await this.userRepo.findOne({ where: { email: dto.email } });
        if (existingUser && existingUser.id !== id) {
          throw new DuplicateResourceException('User', 'email', dto.email);
        }
      }
      
      await this.userRepo.update(id, updateData);
      return this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundCustomException || 
          error instanceof ValidationException || 
          error instanceof DuplicateResourceException) {
        throw error;
      }
      throw new DatabaseException('Failed to update user', 'update');
    }
  }

  async remove(id: number): Promise<void> {
    if (!id || id <= 0) {
      throw new ValidationException('Valid user ID is required');
    }

    try {
      await this.findOne(id); // This will throw if user doesn't exist
      await this.userRepo.delete(id);
    } catch (error) {
      if (error instanceof NotFoundCustomException || error instanceof ValidationException) {
        throw error;
      }
      throw new DatabaseException('Failed to delete user', 'remove');
    }
  }
}
