import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { CreateUserDto } from '../src/users/dto/create-user.dto';
import { UpdateUserDto } from '../src/users/dto/update-user.dto';
import { Locale } from '@kajix/types';
import * as crypto from 'crypto';
import { TransactionHelper } from './helpers/transaction.helper';
import { MailService } from '../src/mail/mail.service';
import * as bcrypt from 'bcrypt';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let txHelper: TransactionHelper;
  let mockMailService: { sendEmail: jest.Mock };

  beforeAll(async () => {
    mockMailService = {
      sendEmail: jest.fn().mockImplementation((to, subject, contentHtml) => {
        console.log(`Mock sending email to: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Content HTML: ${contentHtml}`);
        return Promise.resolve();
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue(mockMailService)
      .compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    txHelper = new TransactionHelper(prisma);

    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  beforeEach(async () => {
    await txHelper.resetDB();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /users', () => {
    let createUserDto: CreateUserDto;

    beforeEach(() => {
      const timestamp = Date.now();
      createUserDto = {
        username: `user-${timestamp}`,
        email: `user-${timestamp}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
      };
    });

    it('should create a user with hashed password', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      // Type assertion to fix "Unsafe assignment of an any value" error
      type UserResponse = typeof createUserDto & {
        id: number;
        createdAt: string;
        updatedAt: string;
        password?: string;
        salt?: string;
      };
      const userData = response.body as UserResponse;

      // Check response format
      expect(userData).toMatchObject({
        id: expect.any(Number),
        username: createUserDto.username,
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Verify password is not returned
      expect(userData.password).toBeUndefined();
      expect(userData.salt).toBeUndefined();

      // Verify password is properly hashed in database
      const user = await prisma.user.findUnique({
        where: { id: userData.id },
      });

      expect(user).not.toBeNull();
      if (!user) return;

      expect(user.password).not.toBe(createUserDto.password);
      expect(user.salt).toBeDefined();

      // Verify the hashing process using bcrypt
      const isPasswordValid = await bcrypt.compare(
        createUserDto.password,
        user.password,
      );
      expect(isPasswordValid).toBe(true);
    });

    it('should fail if email is invalid', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({ ...createUserDto, email: 'invalid-email' })
        .expect(400);
    });

    it('should fail if username is too short', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({ ...createUserDto, username: 'ab' })
        .expect(400);
    });

    it('should fail if password is too short', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({ ...createUserDto, password: '12345' })
        .expect(400);
    });

    it('should fail if email is already registered', async () => {
      // First create a user
      await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      // Try to create another user with the same email
      return request(app.getHttpServer())
        .post('/users')
        .send({
          ...createUserDto,
          username: `different-${Date.now()}`,
        })
        .expect(409);
    });

    it('should fail if username is already taken', async () => {
      // First create a user
      await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      // Try to create another user with the same username
      return request(app.getHttpServer())
        .post('/users')
        .send({
          ...createUserDto,
          email: `different-${Date.now()}@example.com`,
        })
        .expect(409);
    });
  });

  describe('GET /users', () => {
    beforeEach(async () => {
      await txHelper.resetDB();
    });

    it('should return an empty array when no users exist', () => {
      return request(app.getHttpServer()).get('/users').expect(200).expect([]);
    });

    it('should return all users without sensitive data', async () => {
      // Create test users with unique data
      const timestamp = Date.now();
      const user1 = await prisma.user.create({
        data: {
          username: `user1-${timestamp}`,
          email: `user1-${timestamp}@example.com`,
          firstName: 'User',
          lastName: 'One',
          password: 'hash1',
          salt: 'salt1',
        },
      });

      const user2 = await prisma.user.create({
        data: {
          username: `user2-${timestamp}`,
          email: `user2-${timestamp}@example.com`,
          firstName: 'User',
          lastName: 'Two',
          password: 'hash2',
          salt: 'salt2',
        },
      });

      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].password).toBeUndefined();
      expect(response.body[0].salt).toBeUndefined();
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: user1.id,
            username: user1.username,
            email: user1.email,
          }),
          expect.objectContaining({
            id: user2.id,
            username: user2.username,
            email: user2.email,
          }),
        ]),
      );
    });
  });

  describe('PATCH /users/:id', () => {
    let user: any;

    beforeEach(async () => {
      await txHelper.resetDB();
      const timestamp = Date.now();
      user = await prisma.user.create({
        data: {
          username: `update-${timestamp}`,
          email: `update-${timestamp}@example.com`,
          firstName: 'Update',
          lastName: 'Test',
          password: 'hash',
          salt: 'salt',
        },
      });
    });

    it('should update user details without affecting password', async () => {
      const updateDto: UpdateUserDto = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .send(updateDto)
        .expect(200);

      // Verify update
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(updatedUser).not.toBeNull();
      if (!updatedUser) return;

      expect(updatedUser.firstName).toBe(updateDto.firstName);
      expect(updatedUser.lastName).toBe(updateDto.lastName);
      // Password and salt should remain unchanged
      expect(updatedUser.password).toBe(user.password);
      expect(updatedUser.salt).toBe(user.salt);
    });
  });

  describe('DELETE /users/:id', () => {
    let user: any;

    beforeEach(async () => {
      await txHelper.resetDB();
      const timestamp = Date.now();
      user = await prisma.user.create({
        data: {
          username: `delete-${timestamp}`,
          email: `delete-${timestamp}@example.com`,
          firstName: 'Delete',
          lastName: 'Test',
          password: 'hash',
          salt: 'salt',
        },
      });
    });

    it('should delete a user', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${user.id}`)
        .expect(200);

      // Verify deletion
      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(deletedUser).toBeNull();
    });
  });

  describe('POST /users/verify-email', () => {
    let email: string;

    beforeEach(async () => {
      await txHelper.resetDB();
      mockMailService.sendEmail.mockClear();
      email = `test-${Date.now()}@example.com`;
    });

    it('should create verification token and send email in English', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/verify-email')
        .send({ email, locale: Locale.EN })
        .expect(200);

      expect(response.body).toEqual({
        message: 'Verification email sent successfully',
      });

      // Verify token was created in database
      const token = await prisma.tmpToken.findFirst({
        where: { emailTo: email },
      });
      expect(token).not.toBeNull();
      if (!token) throw new Error('Token not found'); // This satisfies TypeScript

      expect(token.emailTo).toBe(email);
      expect(token.expiresAt).toBeDefined();
      expect(token.token).toBeDefined();
      expect(token.locale).toBe(Locale.EN);
      expect(token.type).toBe('EMAIL_CONFIRMATION');
      expect(token.isExpired).toBe(false);
      expect(token.isConfirmed).toBe(false);
      expect(token.isUsed).toBe(false);

      // Verify email was sent with correct parameters
      expect(mockMailService.sendEmail).toHaveBeenCalledTimes(1);
      const [sentTo, subject, content] =
        mockMailService.sendEmail.mock.calls[0];
      expect(sentTo).toBe(email);
      expect(subject).toBe('Confirm your email');
      expect(content).toContain(
        'To complete your registration and access all our AI-powered features, please verify your email address by clicking the button below',
      );
    });

    it('should create verification token and send email in Portuguese', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/verify-email')
        .send({ email, locale: Locale.PTBR })
        .expect(200);

      expect(response.body).toEqual({
        message: 'Verification email sent successfully',
      });

      // Verify token was created in database
      const token = await prisma.tmpToken.findFirst({
        where: { emailTo: email },
      });
      expect(token).not.toBeNull();
      if (!token) throw new Error('Token not found'); // This satisfies TypeScript

      expect(token.emailTo).toBe(email);
      expect(token.expiresAt).toBeDefined();
      expect(token.token).toBeDefined();
      expect(token.locale).toBe(Locale.PTBR);
      expect(token.type).toBe('EMAIL_CONFIRMATION');
      expect(token.isExpired).toBe(false);
      expect(token.isConfirmed).toBe(false);
      expect(token.isUsed).toBe(false);

      // Verify email was sent with correct parameters
      expect(mockMailService.sendEmail).toHaveBeenCalledTimes(1);
      const [sentTo, subject, content] =
        mockMailService.sendEmail.mock.calls[0];
      expect(sentTo).toBe(email);
      expect(subject).toBe('Confirme seu email');
      expect(content).toContain(
        'Para completar seu cadastro e acessar todos os nossos recursos com IA, por favor verifique seu endereço de email clicando no botão abaixo',
      );
    });

    it('should return 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/users/verify-email')
        .send({ email: 'invalid-email', locale: Locale.EN })
        .expect(400);
    });

    it('should return 400 for missing locale', async () => {
      await request(app.getHttpServer())
        .post('/users/verify-email')
        .send({ email })
        .expect(400);
    });

    it('should return 400 for invalid locale', async () => {
      await request(app.getHttpServer())
        .post('/users/verify-email')
        .send({ email, locale: 'INVALID' })
        .expect(400);
    });
  });
});
