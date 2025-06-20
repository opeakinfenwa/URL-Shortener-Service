import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUtilsService } from '../../common/utils/auth.utils';
import { User } from 'src/modules/users/user.entity';
import { ResetPasswordDto } from './dtos/resetPassword.dto';
import { ChangePasswordDto } from './dtos/changePassword.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authUtilsService: AuthUtilsService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email');
    }

    if (!user.password) {
      throw new UnauthorizedException('User has no password set');
    }

    const isPasswordValid = await this.authUtilsService.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(user: Omit<User, 'password'>): Promise<{
    token: string;
    user: Omit<User, 'password'>;
  }> {
    const token = this.authUtilsService.generateAuthToken({
      id: user.id,
    });

    return { token, user };
  }

  async handleGoogleLogin(
    googleId: string,
    email: string,
    name: string,
    authProvider: string,
  ) {
    let user = await this.userRepository.findOne({ where: { googleId } });

    if (!user) {
      user = this.userRepository.create({
        googleId,
        email,
        name,
        authProvider,
      });
      await this.userRepository.save(user);
    }

    const token = this.authUtilsService.generateAuthToken({
      id: user.id,
    });

    return { user, token };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<any> {
    const { email, newPassword, securityAnswer } = dto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isAnswerCorrect = await this.authUtilsService.compareSecurityAnswer(
      securityAnswer,
      user.securityAnswer!,
    );

    if (!isAnswerCorrect) {
      throw new UnauthorizedException('Incorrect security answer');
    }

    const hashedPassword =
      await this.authUtilsService.hashPassword(newPassword);
    return this.userRepository.update(user.id, { password: hashedPassword });
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<any> {
    const { currentPassword, newPassword } = dto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.password) {
      throw new NotFoundException('User not found or has no password');
    }

    const isValid = await this.authUtilsService.comparePassword(
      currentPassword,
      user.password,
    );

    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword =
      await this.authUtilsService.hashPassword(newPassword);
    return this.userRepository.update(userId, { password: hashedPassword });
  }
}