import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

describe('StdLlmTypeController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let jwtToken: string;

  // Mock JWT Auth Guard to allow tests to proceed without real authentication
  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Create a mock JWT token for authorization
    jwtToken = jwtService.sign({ id: 1, username: 'test' });

    await app.init();

    // Clean up test data
    await prisma.stdLLMType.deleteMany({
      where: {
        type: { contains: 'Test E2E' },
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.stdLLMType.deleteMany({
      where: {
        type: { contains: 'Test E2E' },
      },
    });

    await app.close();
  });

  describe('/std-llm-types (POST)', () => {
    it('should create a new LLM type', () => {
      return request(app.getHttpServer())
        .post('/std-llm-types')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          type: 'Test E2E Type',
          isActive: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.type).toBe('Test E2E Type');
          expect(res.body.isActive).toBe(true);
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
        });
    });

    it('should validate request body', () => {
      return request(app.getHttpServer())
        .post('/std-llm-types')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          // Missing required 'type' field
          isActive: true,
        })
        .expect(400);
    });
  });

  describe('/std-llm-types (GET)', () => {
    it('should return an array of LLM types', async () => {
      // Create test data
      const testType = await prisma.stdLLMType.create({
        data: {
          type: 'Test E2E Get All',
          isActive: true,
        },
      });

      return request(app.getHttpServer())
        .get('/std-llm-types')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body.some((item) => item.id === testType.id)).toBe(true);
        });
    });
  });

  describe('/std-llm-types/active (GET)', () => {
    it('should return only active LLM types', async () => {
      // Create test data
      const activeType = await prisma.stdLLMType.create({
        data: {
          type: 'Test E2E Active',
          isActive: true,
        },
      });

      const inactiveType = await prisma.stdLLMType.create({
        data: {
          type: 'Test E2E Inactive',
          isActive: false,
        },
      });

      return request(app.getHttpServer())
        .get('/std-llm-types/active')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.some((item) => item.id === activeType.id)).toBe(true);
          expect(res.body.every((item) => item.isActive === true)).toBe(true);
          expect(res.body.some((item) => item.id === inactiveType.id)).toBe(
            false,
          );
        });
    });
  });

  describe('/std-llm-types/:id (GET)', () => {
    it('should return a specific LLM type by ID', async () => {
      // Create test data
      const testType = await prisma.stdLLMType.create({
        data: {
          type: 'Test E2E Get One',
          isActive: true,
        },
      });

      return request(app.getHttpServer())
        .get(`/std-llm-types/${testType.id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testType.id);
          expect(res.body.type).toBe(testType.type);
          expect(res.body.isActive).toBe(testType.isActive);
        });
    });

    it('should return 404 for non-existent LLM type', () => {
      return request(app.getHttpServer())
        .get('/std-llm-types/99999')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(404);
    });
  });

  describe('/std-llm-types/:id (PATCH)', () => {
    it('should update an LLM type', async () => {
      // Create test data
      const testType = await prisma.stdLLMType.create({
        data: {
          type: 'Test E2E Before Update',
          isActive: true,
        },
      });

      return request(app.getHttpServer())
        .patch(`/std-llm-types/${testType.id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          type: 'Test E2E After Update',
          isActive: false,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testType.id);
          expect(res.body.type).toBe('Test E2E After Update');
          expect(res.body.isActive).toBe(false);
        });
    });

    it('should return 404 for non-existent LLM type', () => {
      return request(app.getHttpServer())
        .patch('/std-llm-types/99999')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          type: 'Updated Type',
        })
        .expect(404);
    });
  });

  describe('/std-llm-types/:id (DELETE)', () => {
    it('should delete an LLM type', async () => {
      // Create test data
      const testType = await prisma.stdLLMType.create({
        data: {
          type: 'Test E2E To Delete',
          isActive: true,
        },
      });

      return request(app.getHttpServer())
        .delete(`/std-llm-types/${testType.id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect(async () => {
          // Verify it's deleted
          const deleted = await prisma.stdLLMType.findUnique({
            where: { id: testType.id },
          });
          expect(deleted).toBeNull();
        });
    });

    it('should return 404 for non-existent LLM type', () => {
      return request(app.getHttpServer())
        .delete('/std-llm-types/99999')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(404);
    });
  });
});
