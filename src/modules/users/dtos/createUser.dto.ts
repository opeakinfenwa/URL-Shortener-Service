import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  authProvider: string = 'local';

  @IsString()
  @IsNotEmpty()
  securityQuestion: string;

  @IsString()
  @IsNotEmpty()
  securityAnswer: string;
}