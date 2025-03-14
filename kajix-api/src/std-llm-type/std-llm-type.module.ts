import { Module } from '@nestjs/common';
import { StdLlmTypeController } from './std-llm-type.controller';
import { StdLlmTypeService } from './std-llm-type.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StdLlmTypeController],
  providers: [StdLlmTypeService],
  exports: [StdLlmTypeService], // Export the service so it can be used by other modules
})
export class StdLlmTypeModule {}
