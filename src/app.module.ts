import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { LoggerModule } from 'src/logger/logger.module';
import { DatabaseModule } from 'src/database/database.module';
import { UrlsModule } from './modules/urls/urls.module';
import { ConfigModule } from '@nestjs/config';
import { SocketModule } from './socket/socket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SocketModule,
    UsersModule,
    UrlsModule,
    AuthModule,
    LoggerModule,
    DatabaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}