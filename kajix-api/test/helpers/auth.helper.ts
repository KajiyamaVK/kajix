import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../src/prisma/prisma.service';
// import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

// interface CreateUserOptions {
//   email: string;
//   username: string;
//   password?: string;
//   firstName?: string;
//   lastName?: string;
// }

// interface TestUser
//   extends Pick<User, 'id' | 'email' | 'username' | 'password' | 'salt'> {}

// interface TestSetup {
//   user: TestUser;
//   token: string;
//   password: string;
// }

export class AuthHelper {
  private jwtService: JwtService;

  constructor(private prisma: PrismaService) {
    this.jwtService = new JwtService({
      secret: process.env.JWT_SECRET || 'test-jwt-secret-key',
    });
  }

  private async hashPassword(
    password: string,
  ): Promise<{ hash: string; salt: string }> {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password, salt);
    return { hash, salt };
  }

  async createTestUser(override: any = {}) {
    const password = override.password || 'password123';
    const { hash, salt } = await this.hashPassword(password);

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
        password: hash,
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
