import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { compareSync } from 'bcrypt';

@Injectable()
export class AuthService {
  private tokenStore: Map<string, { userId: number; expiresAt: number }> =
    new Map();
  private usedRefreshTokens: Set<string> = new Set();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (user && compareSync(password, user.password)) {
      const { ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      timestamp: Date.now(),
    };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    // Store tokens with expiration
    const accessTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    const refreshTokenExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    this.tokenStore.set(`access_token:${user.id}:${accessToken}`, {
      userId: user.id,
      expiresAt: accessTokenExpiry,
    });
    this.tokenStore.set(`refresh_token:${user.id}:${refreshToken}`, {
      userId: user.id,
      expiresAt: refreshTokenExpiry,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }

  async logout(userId: number, accessToken: string, refreshToken: string) {
    this.tokenStore.delete(`access_token:${userId}:${accessToken}`);
    this.tokenStore.delete(`refresh_token:${userId}:${refreshToken}`);
    this.usedRefreshTokens.add(refreshToken);
    return true;
  }

  async refreshToken(userId: number, refreshToken: string) {
    if (this.usedRefreshTokens.has(refreshToken)) {
      throw new UnauthorizedException('Refresh token has been used');
    }

    const tokenKey = `refresh_token:${userId}:${refreshToken}`;
    const storedToken = this.tokenStore.get(tokenKey);

    if (!storedToken || storedToken.expiresAt < Date.now()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new tokens
    const payload = {
      email: user.email,
      sub: user.id,
      timestamp: Date.now(),
    };
    const newAccessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });
    const newRefreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    // Remove old tokens and store new ones
    this.tokenStore.delete(tokenKey);
    this.usedRefreshTokens.add(refreshToken);

    const accessTokenExpiry = Date.now() + 15 * 60 * 1000;
    const refreshTokenExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;

    this.tokenStore.set(`access_token:${user.id}:${newAccessToken}`, {
      userId: user.id,
      expiresAt: accessTokenExpiry,
    });
    this.tokenStore.set(`refresh_token:${user.id}:${newRefreshToken}`, {
      userId: user.id,
      expiresAt: refreshTokenExpiry,
    });

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }

  async isTokenValid(
    userId: number,
    token: string,
    type: 'access' | 'refresh',
  ): Promise<boolean> {
    if (type === 'refresh' && this.usedRefreshTokens.has(token)) {
      return false;
    }

    const tokenKey = `${type}_token:${userId}:${token}`;
    const storedToken = this.tokenStore.get(tokenKey);
    return storedToken !== undefined && storedToken.expiresAt > Date.now();
  }
}
