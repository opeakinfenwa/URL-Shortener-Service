import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';
import { throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    const userId = req.user?.id || 'Guest';
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        this.logger.log(
          `[${userId}] ${method} ${url} - ${responseTime}ms`,
          'LoggingInterceptor',
        );
      }),
      catchError((error) => {
        const responseTime = Date.now() - now;
        this.logger.error(
          `[${userId}] ${method} ${url} - ${error.message} - ${responseTime}ms`,
          error.stack,
          'LoggingInterceptor',
        );
        return throwError(() => error);
      }),
    );
  }
}