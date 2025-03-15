import { PrismaClient } from '@prisma/client';
import { createManyUsers } from './factories/user.factory';
import { createRealLLMCompanies } from './factories/llm.factory';
import { createRealLLMModels } from './factories/llm-model.factory';
import { seedStdLlmTypes } from './seeds/std-llm-types.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seeding...');

  // Seed standard LLM types
  console.log('Seeding standard LLM types...');
  await seedStdLlmTypes(prisma);

  // Create real LLM companies
  console.log('Creating real LLM companies...');
  await createRealLLMCompanies();

  // Create real LLM models
  console.log('Creating real LLM models...');
  await createRealLLMModels();

  // Create sample users
  console.log('Creating sample users...');
  await createManyUsers(10);

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
