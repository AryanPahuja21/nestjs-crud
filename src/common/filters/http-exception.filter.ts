import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
  import { Response } from 'express';
  import { buildErrorResponse } from '../../utils/response.util';
  
  @Catch()
  export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
  
      let status = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Internal server error';
  
      if (exception instanceof HttpException) {
        status = exception.getStatus();
        const res: any = exception.getResponse();
        message =
          typeof res === 'string'
            ? res
            : res.message || JSON.stringify(res);
      } else if (exception instanceof Error) {
        message = exception.message;
      }
  
      response.status(status).json(buildErrorResponse(message, status));
    }
  }
  