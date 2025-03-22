import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TokenFactory } from '../prisma/factories/token.factory';
import { Locale } from '@prisma/client';

describe('UsersController Token Verification (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenFactory: TokenFactory;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    tokenFactory = new TokenFactory(prisma);
  });

  afterAll(async () => {
    await prisma.tmpToken.deleteMany();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.tmpToken.deleteMany();
  });

  describe('/users/verify-token (POST)', () => {
    it('should validate a valid token', async () => {
      const token = await tokenFactory.create({
        emailTo: 'test@example.com',
        locale: Locale.en,
      });

      const response = await request(app.getHttpServer())
        .post('/users/verify-token')
        .send({ token: token.token })
        .expect(200);

      expect(response.body).toEqual({
        message: 'Token validated successfully',
      });

      // Verify token is marked as used in database
      const updatedToken = await prisma.tmpToken.findUnique({
        where: { id: token.id },
      });
      expect(updatedToken?.isUsed).toBe(true);
    });

    it('should reject an expired token', async () => {
      const token = await tokenFactory.createExpired();

      const response = await request(app.getHttpServer())
        .post('/users/verify-token')
        .send({ token: token.token })
        .expect(400);

      expect(response.body.message).toBe('Token has expired');
    });

    it('should reject an already used token', async () => {
      const token = await tokenFactory.createUsed();

      const response = await request(app.getHttpServer())
        .post('/users/verify-token')
        .send({ token: token.token })
        .expect(400);

      expect(response.body.message).toBe('Token has already been used');
    });

    it('should reject a non-existent token', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/verify-token')
        .send({ token: 'non-existent-token' })
        .expect(404);

      expect(response.body.message).toBe('Token not found');
    });

    it('should reject an empty token', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/verify-token')
        .send({ token: '' })
        .expect(400);

      expect(response.body.message).toBe('Token is required');
    });
  });
});
