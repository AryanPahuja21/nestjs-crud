import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserService } from '../../modules/user/user.service';

interface AuthenticatedRequest {
  user: {
    userId: number;
    username: string;
    role: string;
  };
}

@Injectable()
export class EmailVerificationGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if email verification is required for this route
    const requireEmailVerification = this.reflector.getAllAndOverride<boolean>(
      'requireEmailVerification',
      [context.getHandler(), context.getClass()],
    );

    // If email verification is not required, allow access
    if (!requireEmailVerification) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Fetch the latest user data to check email verification status
    const currentUser = await this.userService.findOne(user.userId);

    if (!currentUser.isEmailVerified) {
      throw new UnauthorizedException(
        'Email verification required. Please verify your email address to access this resource.',
      );
    }

    return true;
  }
}
