import { HttpException, HttpStatus } from '@nestjs/common';

export class ValidationException extends HttpException {
  constructor(message: string | string[] = 'Validation failed') {
    super(
      {
        success: false,
        message: Array.isArray(message) ? message : [message],
        error: 'Validation Error',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
