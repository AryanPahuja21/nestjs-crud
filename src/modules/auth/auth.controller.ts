import { Controller, Post, Body, UseFilters, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { RateLimitGuard, RateLimit } from '../../common/guards/rate-limit.guard';
import { LoginResponse } from './interfaces/auth-responses.interface';
import { buildSuccessResponse } from '../../utils/response.util';

interface LoginDto {
  email: string;
  password: string;
}

@ApiTags('auth')
@Controller('auth')
@UseFilters(HttpExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
