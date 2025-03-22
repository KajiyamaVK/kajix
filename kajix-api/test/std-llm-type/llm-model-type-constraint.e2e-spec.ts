import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthHelper } from '../helpers/auth.helper';

describe('LLMModel Type Constraint (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authHelper: AuthHelper;
  let llmCompanyId: number;
  let llmTypeId: number;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    prisma = app.get<PrismaService>(PrismaService);
    authHelper = new AuthHelper(prisma);

    await app.init();

    // Create a test user and get auth token
    const timestamp = Date.now();
    const { token } = await authHelper.createTestUser({
      email: `llm-constraint-${timestamp}@example.com`,
      username: `llm-constraint-${timestamp}`,
    });
    authToken = token;

    // Create test dependencies - a company and a type
    const company = await prisma.lLMCompany.create({
      data: {
        companyName: 'Test LLM Company For Type Constraint',
        isActive: true,
      },
    });
    llmCompanyId = company.id;

    const type = await prisma.stdLLMType.create({
      data: {
        type: 'Test Type For Constraint',
        isActive: true,
      },
    });
    llmTypeId = type.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.lLMModel.deleteMany({
      where: {
        llmCompanyId,
      },
    });

    await prisma.lLMCompany.delete({
      where: { id: llmCompanyId },
    });

    await prisma.stdLLMType.delete({
      where: { id: llmTypeId },
    });

    await app.close();
  });

  describe('POST /llms/models', () => {
    it('should create an LLM model when typeId is provided', () => {
      return request(app.getHttpServer())
        .post('/llms/models')
        .set(authHelper.getAuthHeader(authToken))
        .send({
          displayName: 'Test Model With Type',
          modelName: 'test-model-with-type',
          llmCompanyId: llmCompanyId,
          typeId: llmTypeId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.typeId).toBe(llmTypeId);
          expect(res.body.type).toBeDefined();
          expect(res.body.type.id).toBe(llmTypeId);
        });
    });

    it('should reject creation when typeId is missing', () => {
      return request(app.getHttpServer())
        .post('/llms/models')
        .set(authHelper.getAuthHeader(authToken))
        .send({
          displayName: 'Test Model Without Type',
          modelName: 'test-model-without-type',
          llmCompanyId: llmCompanyId,
          // typeId is intentionally missing
        })
        .expect(400)
        .expect((res) => {
          // The validation error message will contain either of these strings
          expect(res.body.message).toEqual(
            expect.arrayContaining([expect.stringContaining('typeId')]),
          );
        });
    });

    it('should reject creation when typeId is invalid', () => {
      return request(app.getHttpServer())
        .post('/llms/models')
        .set(authHelper.getAuthHeader(authToken))
        .send({
          displayName: 'Test Model With Invalid Type',
          modelName: 'test-model-invalid-type',
          llmCompanyId: llmCompanyId,
          typeId: 99999, // Invalid typeId
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid LLM type ID');
        });
    });
  });

  describe('Database constraint', () => {
    it('should enforce NOT NULL constraint on typeId at database level', async () => {
      try {
        // Try to insert directly using Prisma without a typeId
        await prisma.$executeRaw`
          INSERT INTO llm_models (display_name, model_name, llm_company_id, created_at, updated_at)
          VALUES ('Direct DB Test', 'direct-db-test', ${llmCompanyId}, NOW(), NOW())
        `;
        // If we get here, the test should fail
        expect(true).toBe(false); // Force test failure
      } catch (error) {
        // The error message should contain something about the NULL constraint
        expect(error.message).toContain('null');
      }
    });
  });
});
