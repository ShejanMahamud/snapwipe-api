import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const startTime = Date.now();

    return next.handle().pipe(
      map((originalResponse) => {
        const statusCode = response.statusCode;
        const duration = Date.now() - startTime;

        const data = originalResponse?.data ?? originalResponse;
        const message = originalResponse?.message ?? 'Request successful';
        const customMeta = originalResponse?.meta ?? {};

        return {
          success: true,
          message,
          data,
          meta: {
            statusCode,
            timestamp: new Date().toISOString(),
            path: request.url,
            responseTime: `${duration}ms`,
            ...customMeta,
          },
        };
      }),
    );
  }
}
