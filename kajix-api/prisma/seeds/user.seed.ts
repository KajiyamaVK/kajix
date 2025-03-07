import { PrismaClient } from '@prisma/client';
import { createManyUsers } from '../factories/user.factory';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting User seeding...');

  // Create sample users
  console.log('Creating sample users...');
  await createManyUsers(10);

  console.log('✅ User Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ User Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
