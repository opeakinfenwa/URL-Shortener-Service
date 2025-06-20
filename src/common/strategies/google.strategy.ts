import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import {
  Strategy as GoogleStrategyBase,
  VerifyCallback,
  Profile,
} from 'passport-google-oauth20';
import { AuthService } from 'src/modules/auth/auth.service';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(
  GoogleStrategyBase,
  'google',
) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!,
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error('Email not found from Google'), false);
    const name = profile.displayName;
    const authProvider = 'google';

    try {
      const { user, token } = await this.authService.handleGoogleLogin(
        googleId,
        email,
        name,
        authProvider,
      );

      return done(null, { user, token });
    } catch (error) {
      return done(error, false);
    }
  }
}