import { PrismaService } from '../src/prisma/prisma.service';

export default async function () {
  const prisma = new PrismaService();

  // Clean up the database before all tests
  await prisma.$transaction([
    prisma.appSession.deleteMany(),
    prisma.lLMModel.deleteMany(),
    prisma.lLMCompany.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  await prisma.$disconnect();
}
