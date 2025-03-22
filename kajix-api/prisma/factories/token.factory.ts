import {
  PrismaClient,
  TmpToken,
  TokenType,
  Locale,
  Prisma,
} from '@prisma/client';
import { faker } from '@faker-js/faker';

export class TokenFactory {
  constructor(private prisma: PrismaClient) {}

  async create(
    data: Partial<Prisma.TmpTokenCreateInput> = {},
  ): Promise<TmpToken> {
    const defaultData: Prisma.TmpTokenCreateInput = {
      type: TokenType.EMAIL_CONFIRMATION,
      token: faker.string.alphanumeric(64),
      emailFrom: faker.internet.email(),
      emailTo: faker.internet.email(),
      isUsed: false,
      isExpired: false,
      isConfirmed: false,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      createdAt: new Date(),
      updatedAt: new Date(),
      locale: Locale.en,
      ...data,
    };

    // Let Prisma handle the ID auto-increment
    return this.prisma.tmpToken.create({
      data: defaultData,
    });
  }

  async createExpired(
    data: Partial<Prisma.TmpTokenCreateInput> = {},
  ): Promise<TmpToken> {
    return this.create({
      expiresAt: new Date(Date.now() - 1000), // 1 second ago
      isExpired: true,
      ...data,
    });
  }

  async createUsed(
    data: Partial<Prisma.TmpTokenCreateInput> = {},
  ): Promise<TmpToken> {
    return this.create({
      isUsed: true,
      ...data,
    });
  }
}
