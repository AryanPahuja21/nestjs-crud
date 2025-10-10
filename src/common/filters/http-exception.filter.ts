import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
  } from '@nestjs/common';
  import { Response } from 'express';
  import { buildErrorResponse } from '../../utils/response.util';
  import { NotFoundCustomException } from '../exceptions/not-found.exception';
  import { ValidationException } from '../exceptions/validation.exception';
  import { DuplicateResourceException } from '../exceptions/duplicate-resource.exception';
  import { InvalidCredentialsException } from '../exceptions/invalid-credentials.exception';
  import { DatabaseException } from '../exceptions/database.exception';
  import { QueryFailedError } from 'typeorm';
  
  @Catch()
  export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
  
      let status = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Internal server error';
      let error = 'Internal Server Error';
  
      // Log the exception for debugging
      this.logger.error('Exception caught:', exception);

      if (exception instanceof HttpException) {
        status = exception.getStatus();
        const res: any = exception.getResponse();
        
        if (typeof res === 'object' && res.message) {
          message = res.message;
          error = res.error || exception.name;
        } else {
          message = typeof res === 'string' ? res : exception.message;
          error = exception.name;
        }
      } else if (exception instanceof QueryFailedError) {
        // Handle TypeORM/MongoDB duplicate key errors
        if (exception.message.includes('duplicate') || exception.message.includes('E11000')) {
          status = HttpStatus.CONFLICT;
          message = 'Resource already exists';
          error = 'Duplicate Resource';
        } else {
          status = HttpStatus.BAD_REQUEST;
          message = 'Database query failed';
          error = 'Database Error';
        }
      } else if (exception instanceof Error) {
        message = exception.message;
        error = exception.name;
      }
  
      response.status(status).json(buildErrorResponse(message, status, error));
    }
  }
  