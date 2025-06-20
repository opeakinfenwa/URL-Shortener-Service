import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    if (request.method === 'OPTIONS') {
      response.status(HttpStatus.OK).send();
      return;
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();
      message =
        typeof responseBody === 'string'
          ? responseBody
          : (responseBody as any)?.message || 'An error occurred';
    }

    const logMeta = {
      status,
      path: request.url,
      method: request.method,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    };

    const isProd = this.configService.get('NODE_ENV') === 'production';

    if (isProd) {
      this.logger.error(
        `[${request.method}] ${request.url}  ${message}`,
        logMeta,
      );
    } else {
      this.logger.error(`[${request.method}] ${request.url}  ${message}`, {
        ...logMeta,
        stack: (exception as any)?.stack || 'No stack trace',
      });
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: message,
      ...(isProd ? {} : { stack: (exception as any)?.stack }),
    });
  }
}