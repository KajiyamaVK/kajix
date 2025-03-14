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
    it('should successfully logout a user', async () => {
      // Login first to get tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testSetup.user.email,
          password: testSetup.password,
        })
        .expect(201);

      console.log('Login response:', loginResponse.body);
      console.log(
        'JWT Secret:',
        process.env.JWT_SECRET || 'test-jwt-secret-key',
      );

      // Attempt logout
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set(authHelper.getAuthHeader(loginResponse.body.access_token))
        .send({ refresh_token: loginResponse.body.refresh_token })
        .expect(200);
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
    });
  });
});
