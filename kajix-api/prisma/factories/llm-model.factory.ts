import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { LLMType } from '@types';

const prisma = new PrismaClient();

export interface LLMModelFactoryData {
  displayName?: string;
  modelName?: string;
  llmCompanyId?: number;
  typeId?: number;
}

export async function createLLMModel(data: LLMModelFactoryData = {}) {
  // First, get a random LLM company if not provided
  let llmCompanyId = data.llmCompanyId;
  if (!llmCompanyId) {
    const randomLLM = await prisma.lLMCompany.findFirst({
      orderBy: {
        id: 'asc',
      },
    });
    llmCompanyId = randomLLM?.id;
  }

  if (!llmCompanyId) {
    throw new Error('No LLM companies found in the database');
  }

  // Get a random LLM type if not provided
  let typeId = data.typeId;
  if (!typeId) {
    const randomType = await prisma.stdLLMType.findFirst({
      orderBy: {
        id: 'asc',
      },
    });
    typeId = randomType?.id;
  }

  if (!typeId) {
    throw new Error('No LLM types found in the database');
  }

  const defaultData = {
    displayName: faker.company.catchPhrase(),
    modelName: `${faker.word.adjective()}-${faker.number.int({ min: 1, max: 9 })}B`,
    llmCompanyId,
    typeId,
  };

  const modelData = { ...defaultData, ...data };

  return prisma.lLMModel.create({
    data: modelData,
    include: {
      llmCompany: true,
      type: true,
    },
  });
}

export async function createManyLLMModels(
  count: number,
  data: LLMModelFactoryData = {},
) {
  return Promise.all(Array.from({ length: count }, () => createLLMModel(data)));
}

// Example LLM models for popular companies with type mappings
const popularModels = [
  {
    companyName: 'OpenAI',
    models: [
      {
        name: 'GPT-4o',
        modelName: 'gpt-4o-2024-08-06',
        typeName: LLMType.TEXT,
      },
      {
        name: 'o1',
        modelName: 'o1-2024-12-17',
        typeName: LLMType.TEXT,
      },
      {
        name: 'o3-mini',
        modelName: 'o3-mini-2025-01-31',
        typeName: LLMType.TEXT,
      },
      {
        name: 'Whisper',
        modelName: 'whisper-1',
        typeName: LLMType.TRANSCRIPTION,
      },
      {
        name: 'DALL·E 3',
        modelName: 'dall-e-3',
        typeName: LLMType.IMAGE,
      },
      {
        name: 'text-embedding-3-small',
        modelName: 'text-embedding-3-small',
        typeName: LLMType.EMBEDDING,
      },
      {
        name: 'text-embedding-3-large',
        modelName: 'text-embedding-3-large',
        typeName: LLMType.EMBEDDING,
      },
    ],
  },
  {
    companyName: 'Google DeepMind',
    models: [
      {
        name: 'Gemini 2.0 Flash',
        modelName: 'gemini-2.0-flash',
        typeName: LLMType.TEXT,
      },
      {
        name: 'Imagen 3',
        modelName: 'imagen-3.0-generate-002',
        typeName: LLMType.IMAGE,
      },
    ],
  },
  {
    companyName: 'DeepSeek',
    models: [
      {
        name: 'DeepSeek R1',
        modelName: 'deepseek-reasoner',
        typeName: LLMType.TEXT,
      },
    ],
  },
  {
    companyName: 'Anthropic',
    models: [
      {
        name: 'Claude 3.5 Sonnet',
        modelName: 'claude-3-5-sonnet-20241022',
        typeName: LLMType.TEXT,
      },
      {
        name: 'Claude 3.7 Sonnet',
        modelName: 'claude-3-7-sonnet-20250219',
        typeName: LLMType.TEXT,
      },
    ],
  },
];

export async function createRealLLMModels() {
  const createdModels: Promise<any>[] = [];

  for (const company of popularModels) {
    const llmCompany = await prisma.lLMCompany.findUnique({
      where: { companyName: company.companyName },
    });

    if (llmCompany) {
      for (const model of company.models) {
        // Find the type ID for the given type name
        const llmType = await prisma.stdLLMType.findFirst({
          where: { type: model.typeName },
        });

        if (!llmType) {
          console.warn(
            `LLM type '${model.typeName}' not found, skipping model ${model.name}`,
          );
          continue;
        }

        const modelData = {
          displayName: model.name,
          modelName: model.modelName,
          llmCompanyId: llmCompany.id,
          typeId: llmType.id,
        };
        createdModels.push(createLLMModel(modelData));
      }
    }
  }

  return Promise.all(createdModels);
}
