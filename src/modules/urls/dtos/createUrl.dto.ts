import { IsUrl, IsNotEmpty } from 'class-validator';

export class CreateShortUrlDto {
  @IsUrl()
  @IsNotEmpty()
  originalUrl: string;
}