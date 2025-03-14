import { PrismaClient } from '@prisma/client';
import { COMMON_LLM_TYPES } from '../../src/std-llm-type/std-llm-type.constants';

/**
 * Seed the std_llm_types table with initial data
 */
export async function seedStdLlmTypes(prisma: PrismaClient): Promise<void> {
  console.log('Seeding std_llm_types table...');

  // First, clear any existing records to avoid conflicts with the specified IDs
  try {
    await prisma.stdLLMType.deleteMany({});
    console.log('Cleared existing std_llm_types data');
  } catch (error) {
    console.warn('Could not clear std_llm_types table:', error);
  }

  for (const llmType of COMMON_LLM_TYPES) {
    try {
      await prisma.stdLLMType.create({
        data: {
          id: llmType.id, // Use the exact ID specified in the constants
          type: llmType.type,
          isActive: llmType.isActive,
        },
      });
      console.log(`Created LLM type: ${llmType.type} with ID: ${llmType.id}`);
    } catch (error) {
      console.error(`Failed to create LLM type: ${llmType.type}`, error);
    }
  }

  console.log('std_llm_types table seeded successfully');
}
