import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TraceIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const traceId = request.headers['x-trace-id'] || uuidv4();

    // Attach trace ID to request for use in logs
    request.traceId = traceId;

    // Add trace ID to response headers
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-Trace-Id', traceId);

    return next.handle();
  }
}
