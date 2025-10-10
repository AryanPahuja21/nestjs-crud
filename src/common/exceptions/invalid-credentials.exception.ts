import { HttpException, HttpStatus } from '@nestjs/common';

export class InvalidCredentialsException extends HttpException {
  constructor(message: string = 'Invalid credentials provided') {
    super(
      {
        success: false,
        message,
        error: 'Authentication Failed',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
