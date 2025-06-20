import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthUtilsService } from '../../common/utils/auth.utils';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dtos/createUser.dto';
import { SECURITY_QUESTIONS } from 'src/common/utils/securityQuestions';
import { UpdateUserDto } from './dtos/updateUser.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private authUtilsService: AuthUtilsService,
  ) {}

  async signupUser(createUserDto: CreateUserDto): Promise<User> {
    const {
      email,
      name,
      password,
      authProvider,
      securityQuestion,
      securityAnswer,
    } = createUserDto;

    const googleUser = await this.userRepository.findOne({
      where: { email, authProvider: 'google' },
    });
    if (googleUser) {
      throw new Error('This email is already registered with Google login');
    }

    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new Error('Email already exists');
    }

    if (!SECURITY_QUESTIONS.includes(securityQuestion)) {
      throw new Error('Invalid security question');
    }

    const hashedPassword = await this.authUtilsService.hashPassword(password);
    const hashedAnswer =
      await this.authUtilsService.hashSecurityAnswer(securityAnswer);

    const user = this.userRepository.create({
      email,
      name,
      password: hashedPassword,
      authProvider,
      securityQuestion,
      securityAnswer: hashedAnswer,
    });

    const newUser = this.userRepository.save(user);
    return newUser;
  }

  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const { name, email } = updateUserDto;
    user.name = name ?? user.name;
    user.email = email ?? user.email;

    return this.userRepository.save(user);
  }

  async deleteUser(userId: string): Promise<void> {
    const result = await this.userRepository.delete({ id: userId });
    if (result.affected === 0) {
      throw new NotFoundException('User not found or already deleted');
    }
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}