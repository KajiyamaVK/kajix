import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as crypto from 'crypto';

export class AuthHelper {
  private jwtService: JwtService;

  constructor(private prisma: PrismaService) {
    this.jwtService = new JwtService({
      secret: process.env.JWT_SECRET || 'super-secret-for-dev',
    });
  }

  private generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private hashPassword(password: string, salt: string): string {
    return crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex');
  }

  async createTestUser(override: any = {}) {
    const salt = this.generateSalt();
    const password = override.password || 'password123';

    // Clean up existing users and reset sequence
    await this.prisma.$transaction([
      this.prisma.user.deleteMany(),
      this.prisma.$executeRaw`ALTER SEQUENCE users_id_seq RESTART WITH 1;`,
      this.prisma.$executeRaw`SELECT setval('users_id_seq', 1, false);`,
    ]);

    const user = await this.prisma.user.create({
      data: {
        username: override.username || 'testuser',
        email: override.email || 'test@example.com',
        firstName: override.firstName || 'Test',
        lastName: override.lastName || 'User',
        password: this.hashPassword(password, salt),
        salt,
      },
    });

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      username: user.username,
    });

    return {
      user,
      token,
      password,
    };
  }

  getAuthHeader(token: string): { Authorization: string } {
    return { Authorization: `Bearer ${token}` };
  }
} 