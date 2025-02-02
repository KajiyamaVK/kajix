import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TransactionHelper } from './helpers/transaction.helper';
import { AuthHelper } from './helpers/auth.helper';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let txHelper: TransactionHelper;
  let authHelper: AuthHelper;
  let testSetup: {
    user: any;
    token: string;
    password: string;
  };

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
    it('should authenticate user and create session', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testSetup.user.email,
          password: testSetup.password,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.session_token).toBeDefined();
          expect(res.body.user).toMatchObject({
            id: testSetup.user.id,
            email: testSetup.user.email,
            username: testSetup.user.username,
          });
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

  describe('POST /auth/validate-session', () => {
    let sessionToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testSetup.user.email,
          password: testSetup.password,
        });

      sessionToken = loginResponse.body.session_token;
    });

    it('should validate a valid session', () => {
      return request(app.getHttpServer())
        .post('/auth/validate-session')
        .set('session-token', sessionToken)
        .expect(200)
        .expect((res) => {
          expect(res.body.user).toBeDefined();
          expect(res.body.user.id).toBe(testSetup.user.id);
          expect(res.body.isValid).toBe(true);
        });
    });

    it('should fail with invalid session token', () => {
      return request(app.getHttpServer())
        .post('/auth/validate-session')
        .set('session-token', 'invalid-token')
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    let sessionToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testSetup.user.email,
          password: testSetup.password,
        });

      sessionToken = loginResponse.body.session_token;
    });

    it('should successfully logout and invalidate session', async () => {
      // First logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('session-token', sessionToken)
        .expect(200);

      // Then try to validate the session - should fail
      return request(app.getHttpServer())
        .post('/auth/validate-session')
        .set('session-token', sessionToken)
        .expect(401);
    });

    it('should handle logout with invalid session token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('session-token', 'invalid-token')
        .expect(401);
    });
  });
}); 