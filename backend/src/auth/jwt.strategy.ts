import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET_KEY'),
            passReqToCallback: false,
        });
    }

    async validate(payload: any) {
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
