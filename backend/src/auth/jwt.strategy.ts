import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '../users/schemas/user.schema';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: new ConfigService().getOrThrow<string>('JWT_SECRET_KEY'),
      passReqToCallback: false,
    });
  }

  validate(payload: JwtPayload): { userId: string; email: string; role: Role } {
    /**
     * payload = data stored in the token
     * {
     *  sub: userId,
     *  email: userEmail,
     *  role: userRole
     * }
     */
    const p = payload;
    return {
      userId: p.sub,
      email: p.email,

      role: p.role,
    };
  }
}
