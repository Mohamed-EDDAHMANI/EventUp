import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: this.configService.getOrThrow<string>('JWT_SECRET_KEY'),
      passReqToCallback: false,
    });
  }

  validate(payload: JwtPayload) {
    /**
     * payload = data stored in the token
     * {
     *  sub: userId,
     *  email: userEmail
     * }
     */
    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
}
