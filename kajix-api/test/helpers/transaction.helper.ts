import { PrismaService } from '../../src/prisma/prisma.service';

export class TransactionHelper {
  constructor(private prisma: PrismaService) {}

  async startTransaction() {
    await this.prisma.$executeRaw`BEGIN;`;
  }

  async rollbackTransaction() {
    await this.prisma.$executeRaw`ROLLBACK;`;
  }

  async cleanupTables() {
    const { tablesInProperOrder } = this.setupHelper();
    // List the tables in the correct order to avoid foreign key constraints
    await this.prisma.$transaction(async (prisma) => {
      for (const table of tablesInProperOrder) {
        if (table === 'appSession') {
          await prisma.appSession.deleteMany();
        } else if (table === 'llmModel') {
          await prisma.lLMModel.deleteMany();
        } else if (table === 'llmCompany') {
          await prisma.lLMCompany.deleteMany();
        } else if (table === 'user') {
          await prisma.user.deleteMany();
        }
      }
    });
  }

  async resetSequences() {
    const { tablesInProperOrder } = this.setupHelper();
    await this.prisma.$transaction(async (prisma) => {
      for (const table of tablesInProperOrder) {
        const dbTable = this.getTableName(table);
        await prisma.$executeRawUnsafe(
          `ALTER SEQUENCE ${dbTable}_id_seq RESTART WITH 1`,
        );
        await prisma.$executeRawUnsafe(
          `SELECT setval('${dbTable}_id_seq', 1, false)`,
        );
      }
    });
  }

  async resetDB() {
    await this.cleanupTables();
    await this.resetSequences();
  }

  private getTableName(table: string): string {
    switch (table) {
      case 'llmModel':
        return 'llm_models';
      case 'llmCompany':
        return 'llm_companies';
      case 'user':
        return 'users';
      case 'appSession':
        return 'app_sessions';
      default:
        return table;
    }
  }

  setupHelper() {
    return {
      // Order matters: delete dependent tables first
      tablesInProperOrder: ['appSession', 'llmModel', 'llmCompany', 'user'],
    };
  }
}
