import { HttpException, HttpStatus } from '@nestjs/common';

export class DuplicateResourceException extends HttpException {
  constructor(resource: string, field: string, value: string) {
    super(
      {
        success: false,
        message: `${resource} with ${field} '${value}' already exists`,
        error: 'Duplicate Resource',
      },
      HttpStatus.CONFLICT,
    );
  }
}
