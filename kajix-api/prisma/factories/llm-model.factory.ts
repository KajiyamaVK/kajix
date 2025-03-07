import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

export interface LLMModelFactoryData {
  displayName?: string;
  modelName?: string;
  llmCompanyId?: number;
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

  const defaultData = {
    displayName: faker.company.catchPhrase(),
    modelName: `${faker.word.adjective()}-${faker.number.int({ min: 1, max: 9 })}B`,
    llmCompanyId,
  };

  const modelData = { ...defaultData, ...data };

  return prisma.lLMModel.create({
    data: modelData,
    include: {
      llmCompany: true,
    },
  });
}

export async function createManyLLMModels(
  count: number,
  data: LLMModelFactoryData = {},
) {
  return Promise.all(Array.from({ length: count }, () => createLLMModel(data)));
}

// Example LLM models for popular companies
const popularModels = [
  {
    companyName: 'OpenAI',
    models: ['GPT-4', 'GPT-3.5-Turbo', 'GPT-3.5-Turbo-16k'],
  },
  {
    companyName: 'Anthropic',
    models: ['Claude 3 Opus', 'Claude 3 Sonnet', 'Claude 3 Haiku'],
  },
  { companyName: 'Google DeepMind', models: ['Gemini Pro', 'Gemini Ultra'] },
  {
    companyName: 'Cohere',
    models: ['Command', 'Command-Light', 'Command-Nightly'],
  },
  {
    companyName: 'Mistral AI',
    models: ['Mistral Large', 'Mistral Medium', 'Mistral Small'],
  },
];

export async function createRealLLMModels() {
  const createdModels: Promise<any>[] = [];

  for (const company of popularModels) {
    const llmCompany = await prisma.lLMCompany.findUnique({
      where: { companyName: company.companyName },
    });

    if (llmCompany) {
      for (const modelName of company.models) {
        const modelData = {
          displayName: modelName,
          modelName: modelName.toLowerCase().replace(/\s+/g, '-'),
          llmCompanyId: llmCompany.id,
        };
        createdModels.push(createLLMModel(modelData));
      }
    }
  }

  return Promise.all(createdModels);
}
