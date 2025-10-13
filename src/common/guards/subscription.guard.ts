import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserService } from '../../modules/user/user.service';
import { SUBSCRIPTION_STATUS_KEY } from '../decorators/subscription.decorator';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredStatuses = this.reflector.getAllAndOverride<string[]>(SUBSCRIPTION_STATUS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredStatuses) {
      return true; // No subscription requirement
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const user = await this.userService.findOne(userId);

      if (!user.subscriptionStatus) {
        throw new ForbiddenException('No active subscription found');
      }

      const hasValidSubscription = requiredStatuses.includes(user.subscriptionStatus);

      if (!hasValidSubscription) {
        throw new ForbiddenException(
          `Subscription status '${user.subscriptionStatus}' does not meet requirements. Required: ${requiredStatuses.join(', ')}`,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Unable to verify subscription status');
    }
  }
}
