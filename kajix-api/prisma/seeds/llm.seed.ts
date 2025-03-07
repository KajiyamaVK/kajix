import { PrismaClient } from '@prisma/client';
import {
  createRealLLMCompanies,
  createManyLLMCompanies,
} from '../factories/llm.factory';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting LLM seeding...');

  // Create real LLM companies
  console.log('Creating real LLM companies...');
  await createRealLLMCompanies();

  // Create some additional random LLM companies
  console.log('Creating random LLM companies...');
  await createManyLLMCompanies(5);

  console.log('✅ LLM Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ LLM Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
