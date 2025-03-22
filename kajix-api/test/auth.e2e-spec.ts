import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TransactionHelper } from './helpers/transaction.helper';
import { AuthHelper } from './helpers/auth.helper';
import { User } from '@prisma/client';

interface TestUser extends Pick<User, 'id' | 'email' | 'username'> {}

interface TestSetup {
  user: TestUser;
  token: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: TestUser;
}

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let txHelper: TransactionHelper;
  let authHelper: AuthHelper;
  let testSetup: TestSetup;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    txHelper = new TransactionHelper(prisma);
    authHelper = new AuthHelper(prisma);

    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  beforeEach(async () => {
    await txHelper.resetDB();

    testSetup = await authHelper.createTestUser({
      email: `auth-${Date.now()}@example.com`,
      username: `auth-${Date.now()}`,
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should authenticate user and return both tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testSetup.user.email,
          password: testSetup.password,
        })
        .expect(201);

      const loginResponse = response.body as LoginResponse;
      expect(loginResponse.access_token).toBeDefined();
      expect(loginResponse.refresh_token).toBeDefined();
      expect(loginResponse.user).toMatchObject({
        id: testSetup.user.id,
        email: testSetup.user.email,
        username: testSetup.user.username,
      });

      // Verify tokens are stored in the database
      const storedTokens = await prisma.tmpToken.findMany({
        where: {
          emailTo: testSetup.user.email,
          isExpired: false,
          isUsed: false,
        },
      });

      // Should have both access and refresh tokens
      expect(storedTokens).toHaveLength(2);

      // Verify access token
      const accessToken = storedTokens.find((t) => t.type === 'ACCESS_TOKEN');
      expect(accessToken).toBeDefined();
      expect(accessToken?.token).toBe(loginResponse.access_token);
      expect(accessToken?.emailTo).toBe(testSetup.user.email);
      expect(accessToken?.isExpired).toBe(false);
      expect(accessToken?.isUsed).toBe(false);
      expect(accessToken?.expiresAt).toBeInstanceOf(Date);

      // Verify refresh token
      const refreshToken = storedTokens.find((t) => t.type === 'REFRESH_TOKEN');
      expect(refreshToken).toBeDefined();
      expect(refreshToken?.token).toBe(loginResponse.refresh_token);
      expect(refreshToken?.emailTo).toBe(testSetup.user.email);
      expect(refreshToken?.isExpired).toBe(false);
      expect(refreshToken?.isUsed).toBe(false);
      expect(refreshToken?.expiresAt).toBeInstanceOf(Date);
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'wrong@example.com',
          password: testSetup.password,
        })
        .expect(401);
    });

    it('should fail with invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testSetup.user.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('should successfully logout a user and blacklist tokens', async () => {
      // Login first to get tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testSetup.user.email,
          password: testSetup.password,
        })
        .expect(201);

      // Attempt logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set(authHelper.getAuthHeader(loginResponse.body.access_token))
        .send({ refresh_token: loginResponse.body.refresh_token })
        .expect(200);

      // Verify both tokens are blacklisted
      const blacklistedTokens = await prisma.tmpToken.findMany({
        where: {
          emailTo: testSetup.user.email,
          token: {
            in: [
              loginResponse.body.access_token,
              loginResponse.body.refresh_token,
            ],
          },
        },
      });

      expect(blacklistedTokens).toHaveLength(2);
      blacklistedTokens.forEach((token) => {
        expect(token.isUsed).toBe(true);
        expect(token.isExpired).toBe(true);
      });

      // Try to use the blacklisted access token
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set(authHelper.getAuthHeader(loginResponse.body.access_token))
        .send({ refresh_token: 'any-token' })
        .expect(401);

      // Try to use the blacklisted refresh token
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: loginResponse.body.refresh_token })
        .expect(401);
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testSetup.user.email,
          password: testSetup.password,
        });

      accessToken = response.body.access_token;
      refreshToken = response.body.refresh_token;
    });

    it('should issue new tokens with valid refresh token and invalidate old ones', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(200);

      // Check new tokens are issued
      expect(response.body.access_token).toBeDefined();
      expect(response.body.refresh_token).toBeDefined();
      expect(response.body.access_token).not.toBe(accessToken);
      expect(response.body.refresh_token).not.toBe(refreshToken);

      // Check user data is returned
      expect(response.body.user).toMatchObject({
        id: testSetup.user.id,
        email: testSetup.user.email,
        username: testSetup.user.username,
      });

      // Verify old refresh token is marked as used
      const oldToken = await prisma.tmpToken.findFirst({
        where: {
          token: refreshToken,
          type: 'REFRESH_TOKEN',
        },
      });
      expect(oldToken?.isUsed).toBe(true);
      expect(oldToken?.isExpired).toBe(false); // Should only be marked as used, not expired

      // Verify new tokens are stored
      const newTokens = await prisma.tmpToken.findMany({
        where: {
          emailTo: testSetup.user.email,
          isExpired: false,
          isUsed: false,
          token: {
            in: [response.body.access_token, response.body.refresh_token],
          },
        },
      });

      // Should have both new access and refresh tokens
      expect(newTokens).toHaveLength(2);

      // Verify new access token
      const newAccessToken = newTokens.find((t) => t.type === 'ACCESS_TOKEN');
      expect(newAccessToken).toBeDefined();
      expect(newAccessToken?.token).toBe(response.body.access_token);
      expect(newAccessToken?.emailTo).toBe(testSetup.user.email);
      expect(newAccessToken?.isUsed).toBe(false);
      expect(newAccessToken?.isExpired).toBe(false);

      // Verify new refresh token
      const newRefreshToken = newTokens.find((t) => t.type === 'REFRESH_TOKEN');
      expect(newRefreshToken).toBeDefined();
      expect(newRefreshToken?.token).toBe(response.body.refresh_token);
      expect(newRefreshToken?.emailTo).toBe(testSetup.user.email);
      expect(newRefreshToken?.isUsed).toBe(false);
      expect(newRefreshToken?.isExpired).toBe(false);

      // Try to use the old refresh token again - should fail
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(401);
    });

    it('should fail with invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: 'invalid-token' })
        .expect(401);
    });

    it('should fail with used refresh token', async () => {
      // First refresh - should succeed
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(200);

      // Second refresh with same token - should fail
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(401);

      // Verify token is marked as used in database
      const usedToken = await prisma.tmpToken.findFirst({
        where: {
          token: refreshToken,
          type: 'REFRESH_TOKEN',
        },
      });
      expect(usedToken?.isUsed).toBe(true);
    });

    it('should fail with expired refresh token', async () => {
      // Manually expire the token in the database
      await prisma.tmpToken.updateMany({
        where: {
          token: refreshToken,
          type: 'REFRESH_TOKEN',
        },
        data: {
          isExpired: true,
          expiresAt: new Date(Date.now() - 1000), // Set to past date
        },
      });

      // Try to use expired token
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(401);
    });
  });
});
