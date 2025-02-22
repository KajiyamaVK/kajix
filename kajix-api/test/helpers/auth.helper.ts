import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../src/prisma/prisma.service';
import { User } from '@prisma/client';
import * as crypto from 'crypto';
import { Redis } from 'ioredis';

interface CreateUserOptions {
  email: string;
  username: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

interface TestUser
  extends Pick<User, 'id' | 'email' | 'username' | 'password' | 'salt'> {}

interface TestSetup {
  user: TestUser;
  token: string;
  password: string;
}

export class AuthHelper {
  private jwtService: JwtService;
  private redis: Redis;

  constructor(private prisma: PrismaService) {
    this.jwtService = new JwtService({
      secret: process.env.JWT_SECRET || 'test-jwt-secret-key',
    });

    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6380'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
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

    const jti = crypto.randomBytes(16).toString('hex');
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      username: user.username,
      jti,
      type: 'access',
    });

    // Store token in Redis
    await this.redis.set(
      `access_token:${user.id}:${token}`,
      'valid',
      'EX',
      24 * 60 * 60, // 1 day in seconds
    );

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
