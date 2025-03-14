import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStdLlmTypeDto } from './dto/create-std-llm-type.dto';
import { UpdateStdLlmTypeDto } from './dto/update-std-llm-type.dto';
import { StdLlmTypeResponseDto } from './dto/std-llm-type-response.dto';

@Injectable()
export class StdLlmTypeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateStdLlmTypeDto): Promise<StdLlmTypeResponseDto> {
    return this.prisma.stdLLMType.create({
      data: createDto,
    });
  }

  async findAll(): Promise<StdLlmTypeResponseDto[]> {
    return this.prisma.stdLLMType.findMany();
  }

  async findOne(id: number): Promise<StdLlmTypeResponseDto> {
    const type = await this.prisma.stdLLMType.findUnique({
      where: { id },
    });

    if (!type) {
      throw new NotFoundException(`LLM Type with ID ${id} not found`);
    }

    return type;
  }

  async update(
    id: number,
    updateDto: UpdateStdLlmTypeDto,
  ): Promise<StdLlmTypeResponseDto> {
    try {
      return await this.prisma.stdLLMType.update({
        where: { id },
        data: updateDto,
      });
    } catch (error) {
      throw new NotFoundException(`LLM Type with ID ${id} not found`);
    }
  }

  async remove(id: number): Promise<StdLlmTypeResponseDto> {
    try {
      return await this.prisma.stdLLMType.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`LLM Type with ID ${id} not found`);
    }
  }

  async findActiveTypes(): Promise<StdLlmTypeResponseDto[]> {
    return this.prisma.stdLLMType.findMany({
      where: { isActive: true },
    });
  }

  // Get all models associated with a specific type
  async findModelsWithType(typeId: number): Promise<any[]> {
    const type = await this.findOne(typeId);

    return this.prisma.lLMModel.findMany({
      where: { typeId },
      include: {
        llmCompany: true,
      },
    });
  }
}
