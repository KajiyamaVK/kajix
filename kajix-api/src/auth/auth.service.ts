import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Redis } from 'ioredis';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly redis: Redis;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {
    // In test environment, try to get Redis instance from helper
    if (process.env.NODE_ENV === 'test') {
      const { RedisHelper } = require('../../test/helpers/redis.helper');
      this.redis = RedisHelper.getInstance();
    } else {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0'),
      });
    }
  }

  private hashPassword(password: string, salt: string): string {
    return crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex');
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const hash = this.hashPassword(password, user.salt);
    if (hash !== user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private generateTokens(payload: any) {
    // Add random jti (JWT ID) to make each token unique
    const jti = crypto.randomBytes(16).toString('hex');
    const basePayload = { ...payload, jti };

    const accessToken = this.jwtService.sign(
      { ...basePayload, type: 'access' },
      { expiresIn: '1d' }, // Access token expires in 1 day
    );

    const refreshToken = this.jwtService.sign(
      { ...basePayload, type: 'refresh' },
      { expiresIn: '30d' }, // Refresh token expires in 30 days
    );

    return { accessToken, refreshToken };
  }

  private async storeTokens(userId: number, accessToken: string, refreshToken: string) {
    const multi = this.redis.multi();

    // Store access token with 1 day expiry
    multi.set(
      `access_token:${userId}:${accessToken}`,
      'valid',
      'EX',
      24 * 60 * 60, // 1 day in seconds
    );

    // Store refresh token with 30 days expiry
    multi.set(
      `refresh_token:${userId}:${refreshToken}`,
      'valid',
      'EX',
      30 * 24 * 60 * 60, // 30 days in seconds
    );

    await multi.exec();
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const { accessToken, refreshToken } = this.generateTokens(payload);
    await this.storeTokens(user.id, accessToken, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async logout(userId: number, accessToken: string, refreshToken: string) {
    const multi = this.redis.multi();
    
    // Delete both tokens
    multi.del(`access_token:${userId}:${accessToken}`);
    multi.del(`refresh_token:${userId}:${refreshToken}`);
    
    // Execute both commands and wait for them to complete
    await multi.exec();

    // Verify tokens are actually deleted
    const [accessExists, refreshExists] = await Promise.all([
      this.redis.exists(`access_token:${userId}:${accessToken}`),
      this.redis.exists(`refresh_token:${userId}:${refreshToken}`),
    ]);

    return accessExists === 0 && refreshExists === 0;
  }

  async refreshToken(oldRefreshToken: string) {
    try {
      // Verify and decode the refresh token
      const decoded = this.jwtService.verify(oldRefreshToken);
      
      // Ensure it's a refresh token
      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const userId = decoded.sub;

      // Check if refresh token exists and is valid in Redis
      const isValid = await this.redis.exists(`refresh_token:${userId}:${oldRefreshToken}`);
      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Get user data
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens
      const payload = {
        sub: user.id,
        email: user.email,
        username: user.username,
      };

      const { accessToken, refreshToken } = this.generateTokens(payload);

      // Remove old refresh token first
      await this.redis.del(`refresh_token:${userId}:${oldRefreshToken}`);

      // Verify old token is deleted before storing new ones
      const oldTokenExists = await this.redis.exists(`refresh_token:${userId}:${oldRefreshToken}`);
      if (oldTokenExists) {
        throw new UnauthorizedException('Error invalidating old token');
      }

      // Store new tokens
      await this.storeTokens(userId, accessToken, refreshToken);

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token has expired');
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
