import { Module } from '@nestjs/common';
import { LLMsController } from './llms.controller';
import { LLMsService } from './llms.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [LLMsController],
  providers: [LLMsService, PrismaService],
})
export class LLMsModule {} 