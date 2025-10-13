import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundCustomException } from '../../common/exceptions/not-found.exception';
import { DuplicateResourceException } from '../../common/exceptions/duplicate-resource.exception';
import { ValidationException } from '../../common/exceptions/validation.exception';
import { DatabaseException } from '../../common/exceptions/database.exception';
import { PaymentService } from '../payment/payment.service';
import { SubscriptionService } from '../subscription/subscription.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
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

      // Save user first to get the ID
      const savedUser = await this.userRepo.save(user);

      try {
        // Create Stripe customer
        const stripeCustomer = await this.paymentService.createStripeCustomer(
          savedUser.id.toString(),
          savedUser.email,
          savedUser.name,
        );

        // Update user with Stripe customer ID
        savedUser.stripeCustomerId = stripeCustomer.id;
        await this.userRepo.save(savedUser);

        this.logger.log(
          `✅ Created user ${savedUser.id} with Stripe customer ${stripeCustomer.id}`,
        );

        // Create subscription if priceId is provided
        if (dto.subscriptionPriceId) {
          try {
            this.logger.log(
              `Creating subscription for user ${savedUser.id} with price ${dto.subscriptionPriceId}`,
            );
            const subscriptionResult = await this.subscriptionService.createSubscription(
              savedUser.id.toString(),
              { priceId: dto.subscriptionPriceId },
            );

            this.logger.log(
              `✅ Created subscription ${subscriptionResult.subscription.stripeSubscriptionId} for user ${savedUser.id}`,
            );

            // Note: The subscription service will automatically update the user's subscription info
            // so we don't need to do that here
          } catch (subscriptionError) {
            this.logger.error(
              `❌ Failed to create subscription for user ${savedUser.id}, but user and customer were created:`,
              subscriptionError,
            );
            // Don't fail user creation if subscription fails - they can subscribe later
            // In production, you might want to queue this for retry
          }
        }
      } catch (stripeError) {
        this.logger.error(
          '❌ Failed to create Stripe customer, but user was created:',
          stripeError,
        );
        // Don't fail user creation if Stripe fails - they can be created later
        // In production, you might want to queue this for retry
      }

      return savedUser;
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
      const existingUser = await this.findOne(id); // This will throw if user doesn't exist

      const updateData = { ...dto };
      if (dto.password) {
        updateData.password = await bcrypt.hash(dto.password, 10);
      }

      // Check for email uniqueness if email is being updated
      if (dto.email) {
        const existingUserWithEmail = await this.userRepo.findOne({ where: { email: dto.email } });
        if (existingUserWithEmail && existingUserWithEmail.id !== id) {
          throw new DuplicateResourceException('User', 'email', dto.email);
        }
      }

      await this.userRepo.update(id, updateData);
      const updatedUser = await this.findOne(id);

      // Update Stripe customer info if email or name changed and user has a Stripe customer
      if (existingUser.stripeCustomerId && (dto.email || dto.name)) {
        try {
          const stripeUpdates: { email?: string; name?: string } = {};
          if (dto.email) stripeUpdates.email = dto.email;
          if (dto.name) stripeUpdates.name = dto.name;

          await this.updateUserStripeInfo(id, stripeUpdates);
        } catch (stripeError) {
          this.logger.error(
            'Failed to update Stripe customer info, but user was updated',
            stripeError,
          );
          // Don't fail user update if Stripe update fails
        }
      }

      return updatedUser;
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
      const user = await this.findOne(id); // This will throw if user doesn't exist

      // Delete Stripe customer if exists
      if (user.stripeCustomerId) {
        try {
          await this.deleteUserStripeCustomer(id);
        } catch (stripeError) {
          this.logger.error(
            'Failed to delete Stripe customer, but continuing with user deletion',
            stripeError,
          );
          // Don't fail user deletion if Stripe deletion fails
        }
      }

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

  async createStripeCustomerForUser(userId: number): Promise<string> {
    try {
      const user = await this.findOne(userId);

      if (user.stripeCustomerId) {
        this.logger.warn(`User ${userId} already has Stripe customer ${user.stripeCustomerId}`);
        return user.stripeCustomerId;
      }

      const stripeCustomer = await this.paymentService.createStripeCustomer(
        user.id.toString(),
        user.email,
        user.name,
      );

      // Update user with Stripe customer ID
      await this.userRepo.update(userId, { stripeCustomerId: stripeCustomer.id });

      this.logger.log(`Created Stripe customer ${stripeCustomer.id} for existing user ${userId}`);
      return stripeCustomer.id;
    } catch (error) {
      if (error instanceof NotFoundCustomException) {
        throw error;
      }
      throw new DatabaseException(
        'Failed to create Stripe customer for user',
        'createStripeCustomerForUser',
      );
    }
  }

  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<void> {
    try {
      await this.userRepo.update(userId, { stripeCustomerId });
      this.logger.log(`Updated user ${userId} with Stripe customer ID ${stripeCustomerId}`);
    } catch (error) {
      this.logger.error(`Failed to update user ${userId} with Stripe customer ID`, error);
      throw new DatabaseException(
        'Failed to update user Stripe customer ID',
        'updateStripeCustomerId',
      );
    }
  }

  async updateUserStripeInfo(
    userId: number,
    updates: { email?: string; name?: string },
  ): Promise<void> {
    try {
      const user = await this.findOne(userId);

      if (!user.stripeCustomerId) {
        this.logger.warn(`User ${userId} does not have a Stripe customer ID`);
        return;
      }

      await this.paymentService.updateStripeCustomer(user.stripeCustomerId, updates);
      this.logger.log(`Updated Stripe customer ${user.stripeCustomerId} for user ${userId}`);
    } catch (error) {
      if (error instanceof NotFoundCustomException) {
        throw error;
      }
      throw new DatabaseException('Failed to update Stripe customer info', 'updateUserStripeInfo');
    }
  }

  async deleteUserStripeCustomer(userId: number): Promise<void> {
    try {
      const user = await this.findOne(userId);

      if (!user.stripeCustomerId) {
        this.logger.warn(`User ${userId} does not have a Stripe customer ID`);
        return;
      }

      await this.paymentService.deleteStripeCustomer(user.stripeCustomerId);

      // Remove Stripe customer ID from user
      await this.userRepo.update(userId, { stripeCustomerId: undefined });

      this.logger.log(`Deleted Stripe customer for user ${userId}`);
    } catch (error) {
      if (error instanceof NotFoundCustomException) {
        throw error;
      }
      throw new DatabaseException('Failed to delete Stripe customer', 'deleteUserStripeCustomer');
    }
  }

  /**
   * Update user's subscription information in the database
   */
  async updateUserSubscriptionInfo(
    userId: number,
    updates: {
      subscriptionId?: string;
      subscriptionStatus?: string;
      subscriptionPlan?: string;
      subscriptionEndDate?: Date;
    },
  ): Promise<void> {
    try {
      this.logger.log(`Updating subscription info for user ${userId}`);

      const updateData: Partial<User> = {};

      if (updates.subscriptionId !== undefined) {
        updateData.currentSubscriptionId = updates.subscriptionId;
      }

      if (updates.subscriptionStatus !== undefined) {
        updateData.subscriptionStatus = updates.subscriptionStatus;
      }

      if (updates.subscriptionPlan !== undefined) {
        updateData.subscriptionPlan = updates.subscriptionPlan;
      }

      if (updates.subscriptionEndDate !== undefined) {
        updateData.subscriptionEndDate = updates.subscriptionEndDate;
      }

      await this.userRepo.update(userId, updateData);

      this.logger.log(`✅ Updated subscription info for user ${userId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to update subscription info for user ${userId}:`, error);
      throw new DatabaseException(
        'Failed to update user subscription info',
        'updateUserSubscriptionInfo',
      );
    }
  }
}
