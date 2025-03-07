import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TransactionHelper } from './helpers/transaction.helper';
import { AuthHelper } from './helpers/auth.helper';
import { User } from '@prisma/client';
import { Redis } from 'ioredis';
import { RedisHelper } from './helpers/redis.helper';

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
  let redis: Redis;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    txHelper = new TransactionHelper(prisma);
    authHelper = new AuthHelper(prisma);

    redis = RedisHelper.getInstance();

    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  beforeEach(async () => {
    await txHelper.resetDB();
    await redis.flushdb();

    testSetup = await authHelper.createTestUser({
      email: `auth-${Date.now()}@example.com`,
      username: `auth-${Date.now()}`,
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await RedisHelper.cleanup();
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

      // Verify tokens are stored in Redis
      const accessTokenExists = await redis.exists(
        `access_token:${testSetup.user.id}:${loginResponse.access_token}`,
      );
      const refreshTokenExists = await redis.exists(
        `refresh_token:${testSetup.user.id}:${loginResponse.refresh_token}`,
      );

      expect(accessTokenExists).toBe(1);
      expect(refreshTokenExists).toBe(1);
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

      // Verify tokens are initially stored
      const accessTokenExists = await redis.exists(
        `access_token:${testSetup.user.id}:${accessToken}`,
      );
      const refreshTokenExists = await redis.exists(
        `refresh_token:${testSetup.user.id}:${refreshToken}`,
      );

      expect(accessTokenExists).toBe(1);
      expect(refreshTokenExists).toBe(1);
    });

    it('should successfully logout and remove tokens from Redis', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refresh_token: refreshToken })
        .expect(200);

      // Wait a bit for Redis operations to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify tokens are removed from Redis
      const accessTokenExists = await redis.exists(
        `access_token:${testSetup.user.id}:${accessToken}`,
      );
      const refreshTokenExists = await redis.exists(
        `refresh_token:${testSetup.user.id}:${refreshToken}`,
      );

      expect(accessTokenExists).toBe(0);
      expect(refreshTokenExists).toBe(0);
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

    it('should issue new tokens with valid refresh token', async () => {
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

      // Wait a bit for Redis operations to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify old refresh token is invalidated
      const oldRefreshTokenExists = await redis.exists(
        `refresh_token:${testSetup.user.id}:${refreshToken}`,
      );
      expect(oldRefreshTokenExists).toBe(0);

      // Verify new tokens are stored in Redis
      const newAccessTokenExists = await redis.exists(
        `access_token:${testSetup.user.id}:${response.body.access_token}`,
      );
      const newRefreshTokenExists = await redis.exists(
        `refresh_token:${testSetup.user.id}:${response.body.refresh_token}`,
      );
      expect(newAccessTokenExists).toBe(1);
      expect(newRefreshTokenExists).toBe(1);
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

      // Wait a bit for Redis operations to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Second refresh with same token - should fail
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(401);
    });

    it('should fail after logout', async () => {
      // First logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refresh_token: refreshToken })
        .expect(200);

      // Wait a bit for Redis operations to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Then try to refresh - should fail
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(401);
    });
  });
});
