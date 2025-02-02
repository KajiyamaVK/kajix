import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { CreateUserDto } from '../src/users/dto/create-user.dto';
import { UpdateUserDto } from '../src/users/dto/update-user.dto';
import * as crypto from 'crypto';
import { TransactionHelper } from './helpers/transaction.helper';
import { AuthHelper } from './helpers/auth.helper';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let txHelper: TransactionHelper;
  let authHelper: AuthHelper;

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

      // Check response format
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        username: createUserDto.username,
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Verify password is not returned
      expect(response.body.password).toBeUndefined();
      expect(response.body.salt).toBeUndefined();

      // Verify password is properly hashed in database
      const user = await prisma.user.findUnique({
        where: { id: response.body.id },
      });

      expect(user).not.toBeNull();
      if (!user) return;

      expect(user.password).not.toBe(createUserDto.password);
      expect(user.salt).toBeDefined();

      // Verify the hashing process
      const hashedPassword = crypto
        .pbkdf2Sync(createUserDto.password, user.salt, 1000, 64, 'sha512')
        .toString('hex');
      expect(user.password).toBe(hashedPassword);
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
});
