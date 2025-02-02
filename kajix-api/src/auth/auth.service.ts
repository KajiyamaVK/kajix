import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { Request } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

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

  private generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async createSession(userId: number, req: Request) {
    const token = this.generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Session expires in 7 days

    const session = await this.prisma.appSession.create({
      data: {
        userId,
        token,
        expiresAt,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      },
    });

    return session;
  }

  async validateSession(token: string) {
    const session = await this.prisma.appSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || !session.isValid || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    // Update last active timestamp
    await this.prisma.appSession.update({
      where: { id: session.id },
      data: { lastActive: new Date() },
    });

    return session;
  }

  async invalidateSession(token: string) {
    const session = await this.prisma.appSession.findUnique({
      where: { token },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid session token');
    }

    await this.prisma.appSession.update({
      where: { id: session.id },
      data: { isValid: false },
    });
  }

  async invalidateAllUserSessions(userId: number) {
    await this.prisma.appSession.updateMany({
      where: { userId },
      data: { isValid: false },
    });
  }

  async login(email: string, password: string, req: Request) {
    const user = await this.validateUser(email, password);
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const session = await this.createSession(user.id, req);
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      session_token: session.token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async logout(token: string) {
    await this.invalidateSession(token);
    return { message: 'Logged out successfully' };
  }
}
