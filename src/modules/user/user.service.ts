import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundCustomException } from '../../common/exceptions/not-found.exception';
import { DuplicateResourceException } from '../../common/exceptions/duplicate-resource.exception';
import { ValidationException } from '../../common/exceptions/validation.exception';
import { DatabaseException } from '../../common/exceptions/database.exception';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

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
    // Remove explicit select to let TypeORM load all columns
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
      if (
        error instanceof NotFoundCustomException ||
        error instanceof ValidationException ||
        error instanceof DuplicateResourceException
      ) {
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

  async generateEmailVerificationToken(userId: number): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    try {
      await this.userRepo.update(userId, {
        emailVerificationToken: token,
        emailVerificationTokenExpires: expiresAt,
      });
      return token;
    } catch {
      throw new DatabaseException('Failed to generate verification token', 'generateToken');
    }
  }

  async verifyEmail(token: string): Promise<User> {
    if (!token) {
      throw new ValidationException('Verification token is required');
    }

    try {
      const user = await this.userRepo.findOne({
        where: {
          emailVerificationToken: token,
        },
      });

      if (!user) {
        throw new ValidationException('Invalid verification token');
      }

      if (!user.emailVerificationTokenExpires || user.emailVerificationTokenExpires < new Date()) {
        throw new ValidationException('Verification token has expired');
      }

      if (user.isEmailVerified) {
        throw new ValidationException('Email is already verified');
      }

      // Update user as verified and clear token fields
      await this.userRepo.update(user.id, {
        isEmailVerified: true,
        emailVerificationToken: undefined,
        emailVerificationTokenExpires: undefined,
      });

      return this.findOne(user.id);
    } catch (error) {
      if (error instanceof ValidationException) {
        throw error;
      }
      throw new DatabaseException('Failed to verify email', 'verifyEmail');
    }
  }

  async resendVerificationEmail(email: string): Promise<User> {
    if (!email) {
      throw new ValidationException('Email is required');
    }

    try {
      const user = await this.findByEmail(email);
      if (!user) {
        throw new NotFoundCustomException('User', email);
      }

      if (user.isEmailVerified) {
        throw new ValidationException('Email is already verified');
      }

      return user;
    } catch (error) {
      if (error instanceof ValidationException || error instanceof NotFoundCustomException) {
        throw error;
      }
      throw new DatabaseException('Failed to process resend request', 'resendVerification');
    }
  }
}
