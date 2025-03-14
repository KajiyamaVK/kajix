import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { CreateLLMDto } from '../src/llms/dto/create-llm.dto';
import { UpdateLLMDto } from '../src/llms/dto/update-llm.dto';
import { CreateLLMModelDto } from '../src/llms/dto/create-llm-model.dto';
import { UpdateLLMModelDto } from '../src/llms/dto/update-llm-model.dto';
import { TransactionHelper } from './helpers/transaction.helper';
import { AuthHelper } from './helpers/auth.helper';

describe('LLMsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let txHelper: TransactionHelper;
  let authHelper: AuthHelper;
  let testSetup: {
    user: any;
    token: string;
    llmCompany: any;
    llmModel: any;
    llmType: any;
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

    // Create test user with unique credentials
    const timestamp = Date.now();
    const { user, token } = await authHelper.createTestUser({
      email: `llm-${timestamp}@example.com`,
      username: `llm-${timestamp}`,
    });

    // Create a standard LLM type for tests
    const llmType = await prisma.stdLLMType.create({
      data: {
        type: `Test Type ${timestamp}`,
        isActive: true,
      },
    });

    testSetup = { user, token, llmCompany: null, llmModel: null, llmType };
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  // LLM Company Tests
  describe('GET /llms/companies', () => {
    it('should return an empty array when no LLM companies exist', () => {
      return request(app.getHttpServer())
        .get('/llms/companies')
        .set(authHelper.getAuthHeader(testSetup.token))
        .expect(200)
        .expect([]);
    });

    it('should return all LLM companies', async () => {
      // Create test LLM company
      const llmCompany = await prisma.lLMCompany.create({
        data: { companyName: 'Test Company', isActive: true },
      });
      testSetup.llmCompany = llmCompany;

      const response = await request(app.getHttpServer())
        .get('/llms/companies')
        .set(authHelper.getAuthHeader(testSetup.token))
        .expect(200);

      expect(response.body).toEqual([
        {
          id: llmCompany.id,
          companyName: llmCompany.companyName,
          isActive: llmCompany.isActive,
          createdAt: llmCompany.createdAt.toISOString(),
          updatedAt: llmCompany.updatedAt.toISOString(),
        },
      ]);
    });

    it('should fail if not authenticated', () => {
      return request(app.getHttpServer()).get('/llms/companies').expect(401);
    });
  });

  describe('GET /llms/companies/:id', () => {
    beforeEach(async () => {
      // Create test LLM company
      const llmCompany = await prisma.lLMCompany.create({
        data: { companyName: 'Test Company', isActive: true },
      });
      testSetup.llmCompany = llmCompany;
    });

    it('should return a single LLM company', () => {
      return request(app.getHttpServer())
        .get(`/llms/companies/${testSetup.llmCompany.id}`)
        .set(authHelper.getAuthHeader(testSetup.token))
        .expect(200)
        .expect({
          id: testSetup.llmCompany.id,
          companyName: testSetup.llmCompany.companyName,
          isActive: testSetup.llmCompany.isActive,
          createdAt: testSetup.llmCompany.createdAt.toISOString(),
          updatedAt: testSetup.llmCompany.updatedAt.toISOString(),
        });
    });

    it('should return 404 for non-existent LLM company', () => {
      return request(app.getHttpServer())
        .get('/llms/companies/999999')
        .set(authHelper.getAuthHeader(testSetup.token))
        .expect(404);
    });

    it('should fail if not authenticated', () => {
      return request(app.getHttpServer())
        .get(`/llms/companies/${testSetup.llmCompany.id}`)
        .expect(401);
    });
  });

  describe('POST /llms/companies', () => {
    it('should create an LLM company', () => {
      const createLLMDto: CreateLLMDto = {
        companyName: 'New Company',
        isActive: true,
      };

      return request(app.getHttpServer())
        .post('/llms/companies')
        .set(authHelper.getAuthHeader(testSetup.token))
        .send(createLLMDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: expect.any(Number),
            ...createLLMDto,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
        });
    });

    it('should fail if companyName is missing', () => {
      return request(app.getHttpServer())
        .post('/llms/companies')
        .set(authHelper.getAuthHeader(testSetup.token))
        .send({ isActive: true })
        .expect(400);
    });

    it('should fail if not authenticated', () => {
      return request(app.getHttpServer())
        .post('/llms/companies')
        .send({ companyName: 'Test Company', isActive: true })
        .expect(401);
    });
  });

  describe('PATCH /llms/companies/:id', () => {
    beforeEach(async () => {
      // Create test LLM company
      const llmCompany = await prisma.lLMCompany.create({
        data: { companyName: 'Test Company', isActive: true },
      });
      testSetup.llmCompany = llmCompany;
    });

    it('should update an LLM company', async () => {
      const updateLLMDto: UpdateLLMDto = {
        companyName: 'Updated Company',
        isActive: false,
      };

      const response = await request(app.getHttpServer())
        .patch(`/llms/companies/${testSetup.llmCompany.id}`)
        .set(authHelper.getAuthHeader(testSetup.token))
        .send(updateLLMDto)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testSetup.llmCompany.id,
        ...updateLLMDto,
        createdAt: testSetup.llmCompany.createdAt.toISOString(),
        updatedAt: expect.any(String),
      });

      // Verify the update in the database
      const updatedLLM = await prisma.lLMCompany.findUnique({
        where: { id: testSetup.llmCompany.id },
      });
      expect(updatedLLM).toMatchObject(updateLLMDto);
    });

    it('should return 404 for non-existent LLM company', () => {
      return request(app.getHttpServer())
        .patch('/llms/companies/999999')
        .set(authHelper.getAuthHeader(testSetup.token))
        .send({ companyName: 'Updated Company' })
        .expect(404);
    });

    it('should fail if not authenticated', () => {
      return request(app.getHttpServer())
        .patch(`/llms/companies/${testSetup.llmCompany.id}`)
        .send({ companyName: 'Updated Company' })
        .expect(401);
    });
  });

  describe('DELETE /llms/companies/:id', () => {
    beforeEach(async () => {
      // Create test LLM company
      const llmCompany = await prisma.lLMCompany.create({
        data: { companyName: 'Test Company', isActive: true },
      });
      testSetup.llmCompany = llmCompany;
    });

    it('should delete an LLM company', async () => {
      await request(app.getHttpServer())
        .delete(`/llms/companies/${testSetup.llmCompany.id}`)
        .set(authHelper.getAuthHeader(testSetup.token))
        .expect(200);

      // Verify the deletion
      const deletedLLM = await prisma.lLMCompany.findUnique({
        where: { id: testSetup.llmCompany.id },
      });
      expect(deletedLLM).toBeNull();
    });

    it('should return 404 for non-existent LLM company', () => {
      return request(app.getHttpServer())
        .delete('/llms/companies/999999')
        .set(authHelper.getAuthHeader(testSetup.token))
        .expect(404);
    });

    it('should fail if not authenticated', () => {
      return request(app.getHttpServer())
        .delete(`/llms/companies/${testSetup.llmCompany.id}`)
        .expect(401);
    });
  });

  // LLM Model Tests
  describe('GET /llms/models', () => {
    beforeEach(async () => {
      // Create test LLM company
      const llmCompany = await prisma.lLMCompany.create({
        data: { companyName: 'Test Company', isActive: true },
      });
      testSetup.llmCompany = llmCompany;
    });

    it('should return an empty array when no LLM models exist', () => {
      return request(app.getHttpServer())
        .get('/llms/models')
        .set(authHelper.getAuthHeader(testSetup.token))
        .expect(200)
        .expect([]);
    });

    it('should return all LLM models', async () => {
      // Create test LLM model
      const llmModel = await prisma.lLMModel.create({
        data: {
          displayName: 'Test Model',
          modelName: 'test-model',
          llmCompanyId: testSetup.llmCompany.id,
          typeId: testSetup.llmType.id,
        },
        include: {
          llmCompany: true,
          type: true,
        },
      });
      testSetup.llmModel = llmModel;

      const response = await request(app.getHttpServer())
        .get('/llms/models')
        .set(authHelper.getAuthHeader(testSetup.token))
        .expect(200);

      expect(response.body).toEqual([
        {
          id: llmModel.id,
          displayName: llmModel.displayName,
          modelName: llmModel.modelName,
          llmCompanyId: llmModel.llmCompanyId,
          typeId: llmModel.typeId,
          createdAt: llmModel.createdAt.toISOString(),
          updatedAt: llmModel.updatedAt.toISOString(),
          llmCompany: {
            id: testSetup.llmCompany.id,
            companyName: testSetup.llmCompany.companyName,
            isActive: testSetup.llmCompany.isActive,
            createdAt: testSetup.llmCompany.createdAt.toISOString(),
            updatedAt: testSetup.llmCompany.updatedAt.toISOString(),
          },
          type: {
            id: testSetup.llmType.id,
            type: testSetup.llmType.type,
            isActive: testSetup.llmType.isActive,
            createdAt: testSetup.llmType.createdAt.toISOString(),
            updatedAt: testSetup.llmType.updatedAt.toISOString(),
          },
        },
      ]);
    });

    it('should fail if not authenticated', () => {
      return request(app.getHttpServer()).get('/llms/models').expect(401);
    });
  });

  describe('GET /llms/models/:id', () => {
    beforeEach(async () => {
      // Create test LLM company
      const llmCompany = await prisma.lLMCompany.create({
        data: { companyName: 'Test Company', isActive: true },
      });
      testSetup.llmCompany = llmCompany;

      // Create test LLM model
      const llmModel = await prisma.lLMModel.create({
        data: {
          displayName: 'Test Model',
          modelName: 'test-model',
          llmCompanyId: llmCompany.id,
          typeId: testSetup.llmType.id,
        },
        include: {
          llmCompany: true,
          type: true,
        },
      });
      testSetup.llmModel = llmModel;
    });

    it('should return a single LLM model', () => {
      return request(app.getHttpServer())
        .get(`/llms/models/${testSetup.llmModel.id}`)
        .set(authHelper.getAuthHeader(testSetup.token))
        .expect(200)
        .expect({
          id: testSetup.llmModel.id,
          displayName: testSetup.llmModel.displayName,
          modelName: testSetup.llmModel.modelName,
          llmCompanyId: testSetup.llmModel.llmCompanyId,
          typeId: testSetup.llmModel.typeId,
          createdAt: testSetup.llmModel.createdAt.toISOString(),
          updatedAt: testSetup.llmModel.updatedAt.toISOString(),
          llmCompany: {
            id: testSetup.llmCompany.id,
            companyName: testSetup.llmCompany.companyName,
            isActive: testSetup.llmCompany.isActive,
            createdAt: testSetup.llmCompany.createdAt.toISOString(),
            updatedAt: testSetup.llmCompany.updatedAt.toISOString(),
          },
          type: {
            id: testSetup.llmType.id,
            type: testSetup.llmType.type,
            isActive: testSetup.llmType.isActive,
            createdAt: testSetup.llmType.createdAt.toISOString(),
            updatedAt: testSetup.llmType.updatedAt.toISOString(),
          },
        });
    });

    it('should return 404 for non-existent LLM model', () => {
      return request(app.getHttpServer())
        .get('/llms/models/999999')
        .set(authHelper.getAuthHeader(testSetup.token))
        .expect(404);
    });

    it('should fail if not authenticated', () => {
      return request(app.getHttpServer())
        .get(`/llms/models/${testSetup.llmModel.id}`)
        .expect(401);
    });
  });

  describe('POST /llms/models', () => {
    beforeEach(async () => {
      // Create test LLM company
      const llmCompany = await prisma.lLMCompany.create({
        data: { companyName: 'Test Company', isActive: true },
      });
      testSetup.llmCompany = llmCompany;
    });

    it('should create an LLM model', async () => {
      const createLLMModelDto: CreateLLMModelDto = {
        displayName: 'New Model',
        modelName: 'new-model',
        llmCompanyId: testSetup.llmCompany.id,
        typeId: testSetup.llmType.id,
      };

      return request(app.getHttpServer())
        .post('/llms/models')
        .set(authHelper.getAuthHeader(testSetup.token))
        .send(createLLMModelDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: expect.any(Number),
            ...createLLMModelDto,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            llmCompany: expect.objectContaining({
              id: testSetup.llmCompany.id,
              companyName: testSetup.llmCompany.companyName,
            }),
          });
        });
    });

    it('should fail if required fields are missing', () => {
      return request(app.getHttpServer())
        .post('/llms/models')
        .set(authHelper.getAuthHeader(testSetup.token))
        .send({})
        .expect(400);
    });

    it('should fail if llmCompanyId is invalid', () => {
      return request(app.getHttpServer())
        .post('/llms/models')
        .set(authHelper.getAuthHeader(testSetup.token))
        .send({
          displayName: 'New Model',
          modelName: 'new-model',
          llmCompanyId: 999999,
        })
        .expect(400);
    });

    it('should fail if not authenticated', () => {
      return request(app.getHttpServer())
        .post('/llms/models')
        .send({
          displayName: 'New Model',
          modelName: 'new-model',
          llmCompanyId: testSetup.llmCompany.id,
        })
        .expect(401);
    });
  });

  describe('PATCH /llms/models/:id', () => {
    beforeEach(async () => {
      // Create test LLM company
      const llmCompany = await prisma.lLMCompany.create({
        data: { companyName: 'Test Company', isActive: true },
      });
      testSetup.llmCompany = llmCompany;

      // Create test LLM model
      const llmModel = await prisma.lLMModel.create({
        data: {
          displayName: 'Test Model',
          modelName: 'test-model',
          llmCompanyId: llmCompany.id,
          typeId: testSetup.llmType.id,
        },
      });
      testSetup.llmModel = llmModel;
    });

    it('should update an LLM model', async () => {
      const updateLLMModelDto: UpdateLLMModelDto = {
        displayName: 'Updated Model',
        modelName: 'updated-model',
      };

      const response = await request(app.getHttpServer())
        .patch(`/llms/models/${testSetup.llmModel.id}`)
        .set(authHelper.getAuthHeader(testSetup.token))
        .send(updateLLMModelDto)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testSetup.llmModel.id,
        ...updateLLMModelDto,
        llmCompanyId: testSetup.llmCompany.id,
        createdAt: testSetup.llmModel.createdAt.toISOString(),
        updatedAt: expect.any(String),
        llmCompany: expect.objectContaining({
          id: testSetup.llmCompany.id,
          companyName: testSetup.llmCompany.companyName,
        }),
      });

      // Verify the update in the database
      const updatedModel = await prisma.lLMModel.findUnique({
        where: { id: testSetup.llmModel.id },
      });
      expect(updatedModel).toMatchObject(updateLLMModelDto);
    });

    it('should return 404 for non-existent LLM model', () => {
      return request(app.getHttpServer())
        .patch('/llms/models/999999')
        .set(authHelper.getAuthHeader(testSetup.token))
        .send({ displayName: 'Updated Model' })
        .expect(404);
    });

    it('should fail if not authenticated', () => {
      return request(app.getHttpServer())
        .patch(`/llms/models/${testSetup.llmModel.id}`)
        .send({ displayName: 'Updated Model' })
        .expect(401);
    });
  });

  describe('DELETE /llms/models/:id', () => {
    beforeEach(async () => {
      // Create test LLM company
      const llmCompany = await prisma.lLMCompany.create({
        data: { companyName: 'Test Company', isActive: true },
      });
      testSetup.llmCompany = llmCompany;

      // Create test LLM model
      const llmModel = await prisma.lLMModel.create({
        data: {
          displayName: 'Test Model',
          modelName: 'test-model',
          llmCompanyId: llmCompany.id,
          typeId: testSetup.llmType.id,
        },
      });
      testSetup.llmModel = llmModel;
    });

    it('should delete an LLM model', async () => {
      await request(app.getHttpServer())
        .delete(`/llms/models/${testSetup.llmModel.id}`)
        .set(authHelper.getAuthHeader(testSetup.token))
        .expect(200);

      // Verify the deletion
      const deletedModel = await prisma.lLMModel.findUnique({
        where: { id: testSetup.llmModel.id },
      });
      expect(deletedModel).toBeNull();
    });

    it('should return 404 for non-existent LLM model', () => {
      return request(app.getHttpServer())
        .delete('/llms/models/999999')
        .set(authHelper.getAuthHeader(testSetup.token))
        .expect(404);
    });

    it('should fail if not authenticated', () => {
      return request(app.getHttpServer())
        .delete(`/llms/models/${testSetup.llmModel.id}`)
        .expect(401);
    });
  });
});
