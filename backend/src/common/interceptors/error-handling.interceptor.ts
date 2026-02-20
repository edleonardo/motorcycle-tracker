/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorHandlingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorHandlingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const { traceId } = request;

    return next.handle().pipe(
      catchError((error) => {
        // If it's already an HTTP exception, format it nicely
        if (error instanceof HttpException) {
          const status = error.getStatus();
          const response = error.getResponse();

          const formattedError = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            traceId,
            message: typeof response === 'string' ? response : (response as any).message,
            error: typeof response === 'object' ? (response as any).error : error.name,
          };

          this.logger.error(`[${traceId}] ${error.name}: ${formattedError.message}`, error.stack);

          return throwError(() => new HttpException(formattedError, status));
        }

        // For unexpected errors, return a generic 500
        const formattedError = {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
          traceId,
          message: 'An unexpected error occurred. Please try again later.',
          error: 'Internal Server Error',
        };

        this.logger.error(`[${traceId}] Unexpected error: ${error.message}`, error.stack);

        return throwError(
          () => new HttpException(formattedError, HttpStatus.INTERNAL_SERVER_ERROR),
        );
      }),
    );
  }
}
