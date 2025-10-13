import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import {
  SubscriptionResponseDto,
  SubscriptionPlansResponseDto,
} from './dto/subscription-response.dto';
import { buildSuccessResponse } from '../../utils/response.util';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get all available subscription plans' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Available subscription plans retrieved successfully',
    type: [SubscriptionPlansResponseDto],
  })
  async getAvailablePlans(): Promise<any> {
    const plans = await this.subscriptionService.getAvailablePlans();
    return buildSuccessResponse(plans);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Subscription created successfully',
    type: SubscriptionResponseDto,
  })
  async createSubscription(
    @Body() dto: CreateSubscriptionDto,
    @Request() req: { user: { userId: number; username: string; role: string } },
  ): Promise<any> {
    const result = await this.subscriptionService.createSubscription(
      req.user.userId.toString(),
      dto,
    );

    return buildSuccessResponse(result);
  }

  @Get('my-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user subscription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User subscription retrieved successfully',
    type: SubscriptionResponseDto,
  })
  async getMySubscription(
    @Request() req: { user: { userId: number; username: string; role: string } },
  ): Promise<any> {
    const subscription = await this.subscriptionService.getUserSubscription(
      req.user.userId.toString(),
    );

    return buildSuccessResponse(subscription);
  }

  @Patch('my-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user subscription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription updated successfully',
    type: SubscriptionResponseDto,
  })
  async updateMySubscription(
    @Body() dto: UpdateSubscriptionDto,
    @Request() req: { user: { userId: number; username: string; role: string } },
  ): Promise<any> {
    const subscription = await this.subscriptionService.updateSubscription(
      req.user.userId.toString(),
      dto,
    );

    return buildSuccessResponse(subscription);
  }

  @Delete('my-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel current user subscription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription canceled successfully',
    type: SubscriptionResponseDto,
  })
  async cancelMySubscription(
    @Query('immediately') immediately: string,
    @Request() req: { user: { userId: number; username: string; role: string } },
  ): Promise<any> {
    const cancelImmediately = immediately === 'true';
    const subscription = await this.subscriptionService.cancelSubscription(
      req.user.userId.toString(),
      !cancelImmediately, // cancelAtPeriodEnd is opposite of immediately
    );

    return buildSuccessResponse(subscription);
  }

  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription by user ID (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User subscription retrieved successfully',
    type: SubscriptionResponseDto,
  })
  async getUserSubscription(
    @Param('userId') userId: string,
    @Request() req: { user: { userId: number; username: string; role: string } },
  ): Promise<any> {
    // Only allow admins to view other users' subscriptions
    if (req.user.role !== 'admin' && req.user.userId.toString() !== userId) {
      throw new Error('Forbidden: You can only view your own subscription');
    }

    const subscription = await this.subscriptionService.getUserSubscription(userId);

    return buildSuccessResponse(subscription);
  }
}
