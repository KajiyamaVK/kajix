import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

export interface UserFactoryData {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export async function createUser(data: UserFactoryData = {}) {
  const firstName = data.firstName ?? faker.person.firstName();
  const lastName = data.lastName ?? faker.person.lastName();
  const username = data.username ?? faker.internet.username({ firstName, lastName });
  const email = data.email ?? faker.internet.email({ firstName, lastName });
  const password = data.password ?? faker.internet.password({ length: 12 });

  const salt = generateSalt();
  const hashedPassword = hashPassword(password, salt);

  const userData = {
    username,
    email,
    firstName,
    lastName,
    password: hashedPassword,
    salt,
  };

  return prisma.user.create({
    data: userData,
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createManyUsers(count: number, data: UserFactoryData = {}) {
  return Promise.all(
    Array.from({ length: count }, () => createUser(data)),
  );
} 