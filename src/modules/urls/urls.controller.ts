import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Res,
  UseGuards,
  Ip,
} from '@nestjs/common';
import { Response } from 'express';
import { ShortUrlService } from './urls.service';
import { CreateShortUrlDto } from './dtos/createUrl.dto';
import { JwtAuthGuard } from 'src/common/guards/auth.guards';
import { User } from '../users/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import { OptionalAuthGuard } from 'src/common/guards/optionalAuth.guards';

@Controller('urls')
export class ShortUrlController {
  constructor(private readonly shortUrlService: ShortUrlService) {}

  @UseGuards(OptionalAuthGuard)
  @Post('shorten')
  async shortenUrl(
    @Body() dto: CreateShortUrlDto,
    @AuthUser() user: User | undefined,
    @Ip() ip: string,
  ) {
    const shortUrl = await this.shortUrlService.createShortUrl(dto, user, ip);
    return {
      message: ' Url successfully shortened',
      data: shortUrl,
    };
  }

  @Get(':shortCode')
  async redirectToOriginalUrl(
    @Param('shortCode') shortCode: string,
    @Res() res: Response,
  ) {
    const originalUrl = await this.shortUrlService.getOriginalUrl(shortCode);

    return res.redirect(originalUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats/me')
  async getMyStats(@AuthUser() user: User) {
    const stat = await this.shortUrlService.getStatsForUser(user);
    return {
      message: 'Url stats fetched successfully',
      data: stat,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('claim/:shortCode')
  async claimUrl(
    @Param('shortCode') shortCode: string,
    @AuthUser() user: User,
  ) {
    const shortcodeUrl = await this.shortUrlService.claimShortUrl(
      shortCode,
      user,
    );
    return {
      message: 'Url shortcode successfully claimed',
      data: shortcodeUrl,
    };
  }
}