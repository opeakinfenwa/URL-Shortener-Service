import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShortUrlEntity } from './url.entity';
import { CreateShortUrlDto } from './dtos/createUrl.dto';
import { nanoid } from 'nanoid';
import { User } from '../users/user.entity';
import { SocketGateway } from 'src/socket/socket.gateway';

const ipRequestMap = new Map<string, { count: number; timestamp: number }>();

@Injectable()
export class ShortUrlService {
  private readonly BASE_URL = 'http://localhost:5001/urls';
  private readonly RATE_LIMIT = 5;
  private readonly RATE_LIMIT_TIME = 60000;

  constructor(
    @InjectRepository(ShortUrlEntity)
    private readonly shortUrlRepo: Repository<ShortUrlEntity>,
    private readonly socketGateway: SocketGateway,
  ) {}

  private rateLimitRequest(ip: string) {
    const currentTime = Date.now();
    const ipData = ipRequestMap.get(ip);

    if (ipData) {
      if (currentTime - ipData.timestamp < this.RATE_LIMIT_TIME) {
        if (ipData.count >= this.RATE_LIMIT) {
          throw new HttpException(
            'Rate limit exceeded. Please try again later.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        ipData.count += 1;
      } else {
        ipRequestMap.set(ip, { count: 1, timestamp: currentTime });
      }
    } else {
      ipRequestMap.set(ip, { count: 1, timestamp: currentTime });
    }
  }

  async createShortUrl(dto: CreateShortUrlDto, user?: User, ip?: string) {
    if (!user && ip) {
      this.rateLimitRequest(ip);
    }

    const shortCode = nanoid(7);
    const shortUrlEntity = this.shortUrlRepo.create({
      shortCode,
      originalUrl: dto.originalUrl,
      ...(user && { user }),
    });

    const saved = await this.shortUrlRepo.save(shortUrlEntity);

    const fullShortUrl = `${this.BASE_URL}/${saved.shortCode}`;

    this.socketGateway.emitShortLinkCreated({
      shortUrl: fullShortUrl,
      userId: user?.id ?? null,
      timestamp: new Date(),
    });

    return {
      shortUrl: fullShortUrl,
      originalUrl: saved.originalUrl,
      shortCode: saved.shortCode,
      createdAt: saved.createdAt,
    };
  }

  async getOriginalUrl(shortCode: string) {
    const found = await this.shortUrlRepo.findOne({
      where: { shortCode },
    });

    if (!found) throw new NotFoundException('Short URL not found');

    found.clickCount += 1;
    await this.shortUrlRepo.save(found);

    return found.originalUrl;
  }

  async getStatsForUser(user: User) {
    if (!user || !user.id)
      throw new ForbiddenException('Authentication required');

    return this.shortUrlRepo.find({
      where: { user: { id: user.id } },
      select: ['shortCode', 'originalUrl', 'clickCount', 'createdAt'],
    });
  }

  async claimShortUrl(shortCode: string, user: User) {
    const shortUrl = await this.shortUrlRepo.findOne({ where: { shortCode } });

    if (!shortUrl) throw new NotFoundException('Short URL not found');

    if (shortUrl.user) {
      throw new ForbiddenException(
        'This URL is already claimed by another user.',
      );
    }

    shortUrl.user = user;
    return this.shortUrlRepo.save(shortUrl);
  }
}