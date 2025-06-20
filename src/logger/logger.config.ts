import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import { ConfigService } from '@nestjs/config';
import { LoggerOptions } from 'winston';

export function createWinstonLoggerConfig(
  configService: ConfigService,
): LoggerOptions {
  const environment = configService.get<string>('NODE_ENV');

  const transports: winston.transport[] = [
    new winston.transports.File({
      filename: 'logs/combined.log',
      level: 'info',
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/exceptions.log',
      level: 'warn',
      handleExceptions: true,
    }),
  ];

  if (environment !== 'production') {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          nestWinstonModuleUtilities.format.nestLike('App', {
            prettyPrint: true,
          }),
        ),
      }),
    );
  }

  return {
    transports,
    exitOnError: false,
  };
}