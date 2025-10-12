import { Controller, Post, Body, UseFilters, UseGuards, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { ApiTags, ApiBody, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { RateLimitGuard, RateLimit } from '../../common/guards/rate-limit.guard';
import { LoginResponse } from './interfaces/auth-responses.interface';
import { buildSuccessResponse } from '../../utils/response.util';
import { VerifyEmailDto, ResendVerificationDto } from './dto/verify-email.dto';
import { UserService } from '../user/user.service';
import { EmailService } from '../email/email.service';

interface LoginDto {
  email: string;
  password: string;
}

@ApiTags('auth')
@Controller('auth')
@UseFilters(HttpExceptionFilter)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
  ) {}

  @Post('login')
  @UseGuards(RateLimitGuard)
  @RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Maximum 5 login attempts per 15 minutes
    message: 'Too many login attempts. Please try again later.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'aryan@example.com' },
        password: { type: 'string', example: '123456' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        timestamp: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Too many login attempts. Please try again later.' },
        error: { type: 'string', example: 'Rate Limit Exceeded' },
        retryAfter: { type: 'number', example: 300 },
      },
    },
  })
  async login(@Body() body: LoginDto): Promise<LoginResponse> {
    const user = await this.authService.validateUser(body.email, body.password);
    const tokenData = this.authService.login(user);

    return buildSuccessResponse({
      access_token: tokenData.access_token,
    });
  }

  @Post('verify-email')
  @UseGuards(RateLimitGuard)
  @RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Maximum 10 attempts per 15 minutes
    message: 'Too many verification attempts. Please try again later.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: 'abc123def456' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Email verified successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        timestamp: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Email verified successfully' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
      },
    },
  })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const user = await this.userService.verifyEmail(dto.token);

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.name);

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, emailVerificationToken, emailVerificationTokenExpires, ...safeUser } = user;

    return buildSuccessResponse({
      message: 'Email verified successfully',
      user: safeUser,
    });
  }

  @Post('resend-verification')
  @UseGuards(RateLimitGuard)
  @RateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Maximum 5 resend attempts per hour
    message: 'Too many resend attempts. Please try again later.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Verification email sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        timestamp: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Verification email sent successfully' },
          },
        },
      },
    },
  })
  async resendVerificationEmail(@Body() dto: ResendVerificationDto) {
    const user = await this.userService.resendVerificationEmail(dto.email);
    const token = await this.userService.generateEmailVerificationToken(user.id);

    await this.emailService.sendVerificationEmail(user.email, user.name, token);

    return buildSuccessResponse({
      message: 'Verification email sent successfully',
    });
  }

  @Get('verify-email/:token')
  @ApiOperation({ summary: 'Verify email via GET request (for direct email links)' })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    content: {
      'text/html': {
        schema: {
          type: 'string',
          example: '<html><body><h1>Email verified successfully!</h1></body></html>',
        },
      },
    },
  })
  async verifyEmailViaGet(@Param('token') token: string, @Res() res: Response): Promise<void> {
    try {
      const user = await this.userService.verifyEmail(token);

      // Send welcome email
      await this.emailService.sendWelcomeEmail(user.email, user.name);

      // Return HTML response
      res.send(`
        <html>
          <head>
            <title>Email Verified</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .success { color: #28a745; }
              .container { max-width: 500px; margin: 0 auto; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="success">✅ Email Verified Successfully!</h1>
              <p>Hi ${user.name}!</p>
              <p>Your email address has been verified. You can now access all features of our platform.</p>
              <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">Continue to Application</a></p>
            </div>
          </body>
        </html>
      `);
    } catch {
      res.send(`
        <html>
          <head>
            <title>Verification Failed</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #dc3545; }
              .container { max-width: 500px; margin: 0 auto; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">❌ Verification Failed</h1>
              <p>The verification link is invalid or has expired.</p>
              <p>Please request a new verification email.</p>
              <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">Go to Application</a></p>
            </div>
          </body>
        </html>
      `);
    }
  }
}
