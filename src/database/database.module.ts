import {
  Module,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
  OnApplicationShutdown,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { LoggerModule } from '../logger/logger.module';
import databaseConfig from './database.config';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forFeature(databaseConfig),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        console.log('Resolved DB URL:', dbConfig.uri);

        const maxRetries = 5;
        const delayMs = 3000;

        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            return {
              type: 'postgres',
              url: dbConfig.uri,
              connectTimeoutMS: dbConfig.connectTimeoutMS,
              synchronize: false,
              autoLoadEntities: true,
              logging: configService.get('NODE_ENV') === 'development',
            };
          } catch (err) {
            lastError = err;
            console.warn(
              `DB connection attempt ${attempt} failed. Retrying in ${delayMs / 1000}s...`,
            );
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }

        console.error('DB connection failed after maximum retries.', lastError);
        throw lastError;
      },
    }),
  ],
})
export class DatabaseModule
  implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown
{
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
  ) {}

  async onModuleInit() {
    this.logger.log('info', 'DatabaseModule initialized', {
      context: 'DatabaseModule',
    });
  }

  async onModuleDestroy() {
    this.logger.log('info', 'DatabaseModule destroyed', {
      context: 'DatabaseModule',
    });
  }

  async onApplicationShutdown() {
    this.logger.log(
      'info',
      'Application shutdown triggered DatabaseModule cleanup',
      {
        context: 'DatabaseModule',
      },
    );
  }
}