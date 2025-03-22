import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { UserDto } from '@src/users/dto/user.dto';
import { TokenType } from '@kajix/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async validateUser(loginDto: LoginDto): Promise<any> {
    const userWithPassword = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });
    if (!userWithPassword) {
      return null; // User not found
    }
    const isMatch = bcrypt.compareSync(
      loginDto.password,
      userWithPassword.password,
    );
    if (!isMatch) {
      return null;
    }
    const user = await this.usersService.findByEmail(loginDto.email);
    return user;
  }

  async login(user: UserDto) {
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

    // Save both tokens in TmpTokens table
    await Promise.all([
      this.prisma.tmpToken.create({
        data: {
          type: TokenType.ACCESS_TOKEN,
          emailFrom: 'system@kajix.io', // System generated token
          emailTo: user.email,
          token: accessToken,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
          locale: 'en', // Default locale
        },
      }),
      this.prisma.tmpToken.create({
        data: {
          type: TokenType.REFRESH_TOKEN,
          emailFrom: 'system@kajix.io', // System generated token
          emailTo: user.email,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          locale: 'en', // Default locale
        },
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user,
    };
  }

  async refreshToken(userId: number, refreshToken: string) {
    try {
      // Verify the refresh token. This will throw an error if it's invalid or expired.
      const payload = this.jwtService.verify(refreshToken);

      // Check if the user ID in the token matches the provided user ID
      if (payload.sub !== userId) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if token is blacklisted (used or expired)
      const existingToken = await this.prisma.tmpToken.findFirst({
        where: {
          token: refreshToken,
          type: 'REFRESH_TOKEN',
        },
      });

      if (!existingToken || existingToken.isUsed || existingToken.isExpired) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Get the user
      const user = await this.usersService.findOne(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Mark the current refresh token as used
      await this.prisma.tmpToken.update({
        where: { id: existingToken.id },
        data: { isUsed: true },
      });

      // Generate new tokens
      const newPayload = {
        email: user.email,
        sub: user.id,
        timestamp: Date.now(),
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m',
      });
      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: '7d',
      });

      // Store new tokens
      await Promise.all([
        this.prisma.tmpToken.create({
          data: {
            type: 'ACCESS_TOKEN',
            emailFrom: 'system@kajix.io',
            emailTo: user.email,
            token: newAccessToken,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
            locale: 'en',
          },
        }),
        this.prisma.tmpToken.create({
          data: {
            type: 'REFRESH_TOKEN',
            emailFrom: 'system@kajix.io',
            emailTo: user.email,
            token: newRefreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            locale: 'en',
          },
        }),
      ]);

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        user,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: number, accessToken: string, refreshToken: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Mark both tokens as used
    await Promise.all([
      this.prisma.tmpToken.updateMany({
        where: {
          token: accessToken,
          type: 'ACCESS_TOKEN',
          emailTo: user.email,
        },
        data: {
          isUsed: true,
          isExpired: true,
        },
      }),
      this.prisma.tmpToken.updateMany({
        where: {
          token: refreshToken,
          type: 'REFRESH_TOKEN',
          emailTo: user.email,
        },
        data: {
          isUsed: true,
          isExpired: true,
        },
      }),
    ]);

    return true;
  }

  // You don't need isTokenValid, if you are using jwtService.verify correctly
  // You should have a JwtStrategy defined to use Guards with JWT
}
