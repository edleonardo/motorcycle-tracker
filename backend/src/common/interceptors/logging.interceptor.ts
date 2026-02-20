import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const { method, url, traceId } = request;
    const now = Date.now();

    // Get the controller and handler names for context
    const controller = context.getClass().name;
    const handler = context.getHandler().name;
    const logger = new Logger(`${controller}.${handler}`);

    logger.log(`[${traceId}] ${method} ${url} - Request started`);

    return next.handle().pipe(
      tap({
        next: () => {
          const elapsed = Date.now() - now;
          logger.log(`[${traceId}] ${method} ${url} - Completed in ${elapsed}ms`);
        },
        error: (error) => {
          const elapsed = Date.now() - now;
          logger.error(`[${traceId}] ${method} ${url} - Failed in ${elapsed}ms: ${error.message}`);
        },
      }),
    );
  }
}
