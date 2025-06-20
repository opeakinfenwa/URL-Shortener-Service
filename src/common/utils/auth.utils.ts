import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class AuthUtilsService {
  async hashPassword(password: string) {
    const hashed = await bcrypt.hash(password, 10);
    return hashed;
  }

  async comparePassword(password: string, hashed: string) {
    const isMatch = await bcrypt.compare(password, hashed);
    return isMatch;
  }

  async hashSecurityAnswer(answer: string) {
    const hashedAnswer = await bcrypt.hash(answer.trim().toLowerCase(), 10);
    return hashedAnswer;
  }

  generateAuthToken(payload: { id: string }) {
    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '1d',
    });
    return token;
  }

  async compareSecurityAnswer(
    providedAnswer: string,
    storedHashedAnswer?: string,
  ): Promise<boolean> {
    if (!storedHashedAnswer) return false;

    const normalizedAnswer = providedAnswer.trim().toLowerCase();
    return bcrypt.compare(normalizedAnswer, storedHashedAnswer);
  }
}