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

    return next.handle().pipe(
      map((data) => {
        // Make sure status code is already set (default is 200)
        const statusCode = response.statusCode;

        return {
          status: true,
          message: data?.message || 'Request successful',
          data: data?.data !== undefined ? data.data : data,
          meta: {
            statusCode,
            timestamp: new Date().toISOString(),
            path: request.url,
          },
        };
      }),
    );
  }
}
