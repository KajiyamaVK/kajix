import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Redis } from 'ioredis';

interface JwtPayload {
  sub: string;
  email: string;
  username: string;
}

interface UserFromJwt {
  id: string;
  email: string;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly redis: Redis;

  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'test-jwt-secret-key',
      passReqToCallback: true,
    });

    // In test environment, try to get Redis instance from helper
    if (process.env.NODE_ENV === 'test') {
      const { RedisHelper } = require('../../test/helpers/redis.helper');
      this.redis = RedisHelper.getInstance();
    } else {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6380'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0'),
        lazyConnect: true,
      });
    }
  }

  async validate(req: any, payload: any) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    
    // Check if token exists in Redis
    const isValid = await this.redis.exists(`access_token:${payload.sub}:${token}`);
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
