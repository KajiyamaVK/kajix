import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisService } from '../redis/redis.service';
// import type { RedisHelper } from '../../test/helpers/redis.helper';

// interface JwtPayload {
//   sub: string;
//   email: string;
//   username: string;
// }

// interface UserFromJwt {
//   id: string;
//   email: string;
//   username: string;
// }

@Injectable()
export class JwtStrategy
  extends PassportStrategy(Strategy)
  implements OnModuleInit
{
  private redis!: Redis;

  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'test-jwt-secret-key',
      passReqToCallback: true,
    });
  }

  async onModuleInit() {
    this.redis = RedisService.getInstance();
  }

  async validate(req: any, payload: any) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    // Check if token exists in Redis
    const isValid = await this.redis.exists(
      `access_token:${payload.sub}:${token}`,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid token');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      username: payload.username,
      accessToken: token,
    };
  }
}
