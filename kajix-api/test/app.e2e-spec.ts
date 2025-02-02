import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    
    // Use the same pipes as the main app
    app.useGlobalPipes(new ValidationPipe());
    
    await app.init();
  });

  beforeEach(async () => {
    // Start transaction before each test
    await prisma.$transaction(async (tx) => {
      await tx.lLMModel.deleteMany();
      await tx.lLMCompany.deleteMany();
      await tx.user.deleteMany();
    });
  });

  afterEach(async () => {
    // Rollback transaction after each test
    await prisma.$executeRaw`ROLLBACK;`;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });
}); 