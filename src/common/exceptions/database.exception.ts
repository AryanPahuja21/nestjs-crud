import { HttpException, HttpStatus } from '@nestjs/common';

export class DatabaseException extends HttpException {
  constructor(message: string = 'Database operation failed', operation?: string) {
    super(
      {
        success: false,
        message: operation ? `${operation}: ${message}` : message,
        error: 'Database Error',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
