import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

export interface LLMFactoryData {
  companyName?: string;
  isActive?: boolean;
}

export async function createLLMCompany(data: LLMFactoryData = {}) {
  const defaultData = {
    companyName: faker.company.name(),
    isActive: faker.datatype.boolean(),
  };

  const llmData = { ...defaultData, ...data };

  return prisma.lLMCompany.create({
    data: llmData,
  });
}

export async function createManyLLMCompanies(
  count: number,
  data: LLMFactoryData = {},
) {
  return Promise.all(
    Array.from({ length: count }, () => createLLMCompany(data)),
  );
}

const llmCompanies = [
  'OpenAI',
  'Anthropic',
  'Google DeepMind',
  'Cohere',
  'AI21 Labs',
  'Mistral AI',
  'DeepSeek',
  'Meta AI',
  'Character AI',
  'Inflection AI',
];

export async function createRealLLMCompanies() {
  return Promise.all(
    llmCompanies.map(async (companyName) => {
      // Check if the company already exists
      const existingCompany = await prisma.lLMCompany.findUnique({
        where: { companyName },
      });

      if (!existingCompany) {
        // Only create if it doesn't exist
        return prisma.lLMCompany.create({
          data: {
            companyName,
            isActive: true,
          },
        });
      } else {
        console.log(
          `Company ${companyName} already exists, skipping creation.`,
        );
        return existingCompany;
      }
    }),
  );
}
