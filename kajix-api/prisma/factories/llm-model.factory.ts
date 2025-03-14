import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

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
      { name: 'GPT-4', typeName: 'text' },
      { name: 'GPT-3.5-Turbo', typeName: 'text' },
      { name: 'GPT-3.5-Turbo-16k', typeName: 'text' },
    ],
  },
  {
    companyName: 'Anthropic',
    models: [
      { name: 'Claude 3 Opus', typeName: 'text' },
      { name: 'Claude 3 Sonnet', typeName: 'text' },
      { name: 'Claude 3 Haiku', typeName: 'text' },
    ],
  },
  {
    companyName: 'Google DeepMind',
    models: [
      { name: 'Gemini Pro', typeName: 'text' },
      { name: 'Gemini Ultra', typeName: 'text' },
    ],
  },
  {
    companyName: 'Cohere',
    models: [
      { name: 'Command', typeName: 'text' },
      { name: 'Command-Light', typeName: 'text' },
      { name: 'Command-Nightly', typeName: 'text' },
      { name: 'Embed', typeName: 'embedding' },
    ],
  },
  {
    companyName: 'Mistral AI',
    models: [
      { name: 'Mistral Large', typeName: 'text' },
      { name: 'Mistral Medium', typeName: 'text' },
      { name: 'Mistral Small', typeName: 'text' },
      { name: 'Mistral Embed', typeName: 'embedding' },
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
          modelName: model.name.toLowerCase().replace(/\s+/g, '-'),
          llmCompanyId: llmCompany.id,
          typeId: llmType.id,
        };
        createdModels.push(createLLMModel(modelData));
      }
    }
  }

  return Promise.all(createdModels);
}
