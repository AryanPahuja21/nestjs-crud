import { HttpException, HttpStatus } from '@nestjs/common';

export class NotFoundCustomException extends HttpException {
  constructor(entity: string, id?: string | number) {
    super(
      {
        success: false,
        message: `${entity} not found${id ? ` with ID ${id}` : ''}`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
