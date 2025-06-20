import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { CommonModule } from 'src/common/common.module';
import { DatabaseModule } from 'src/database/database.module';
import { ShortUrlService } from './urls.service';
import { ShortUrlController } from './urls.controller';
import { ShortUrlEntity } from './url.entity';
import { JwtStrategy } from 'src/common/strategies/jwt.strategy';
import { SocketModule } from 'src/socket/socket.module';

@Module({
  imports: [
    DatabaseModule,
    CommonModule,
    SocketModule,
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([ShortUrlEntity]),
  ],
  controllers: [ShortUrlController],
  providers: [ShortUrlService, JwtStrategy],
})
export class UrlsModule {}