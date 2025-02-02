import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLLMDto } from './dto/create-llm.dto';
import { UpdateLLMDto } from './dto/update-llm.dto';
import { CreateLLMModelDto } from './dto/create-llm-model.dto';
import { UpdateLLMModelDto } from './dto/update-llm-model.dto';
import { Prisma } from '@prisma/client';
import { PrismaErrorCode } from '../prisma/prisma.constants';

@Injectable()
export class LLMsService {
  private readonly defaultModelSelect = {
    id: true,
    displayName: true,
    modelName: true,
    llmCompanyId: true,
    createdAt: true,
    updatedAt: true,
    llmCompany: {
      select: {
        id: true,
        companyName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    },
  } as const;

  private readonly defaultCompanySelect = {
    id: true,
    companyName: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  constructor(private prisma: PrismaService) {}

  // LLM Company methods
  async createCompany(createLlmDto: CreateLLMDto) {
    try {
      return await this.prisma.lLMCompany.create({
        data: createLlmDto,
        select: this.defaultCompanySelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION) {
          throw new ConflictException('LLM company already exists');
        }
      }
      throw new InternalServerErrorException('Failed to create LLM company');
    }
  }

  async findAllCompanies() {
    try {
      return await this.prisma.lLMCompany.findMany({
        select: this.defaultCompanySelect,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch LLM companies');
    }
  }

  async findOneCompany(id: number) {
    try {
      const llm = await this.prisma.lLMCompany.findUnique({
        where: { id },
        select: this.defaultCompanySelect,
      });

      if (!llm) {
        throw new NotFoundException(`LLM company with ID ${id} not found`);
      }

      return llm;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to fetch LLM company');
    }
  }

  async updateCompany(id: number, updateLlmDto: UpdateLLMDto) {
    try {
      return await this.prisma.lLMCompany.update({
        where: { id },
        data: updateLlmDto,
        select: this.defaultCompanySelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case PrismaErrorCode.RECORD_NOT_FOUND:
            throw new NotFoundException(`LLM company with ID ${id} not found`);
          case PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION:
            throw new ConflictException('Updated company name already exists');
          default:
            throw new InternalServerErrorException('Database operation failed');
        }
      }
      throw error;
    }
  }

  async removeCompany(id: number) {
    try {
      return await this.prisma.lLMCompany.delete({
        where: { id },
        select: this.defaultCompanySelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === PrismaErrorCode.RECORD_NOT_FOUND) {
          throw new NotFoundException(`LLM company with ID ${id} not found`);
        }
      }
      throw new InternalServerErrorException('Failed to delete LLM company');
    }
  }

  async findCompanyByName(companyName: string) {
    try {
      const llm = await this.prisma.lLMCompany.findUnique({
        where: { companyName },
        select: this.defaultCompanySelect,
      });

      if (!llm) {
        throw new NotFoundException(
          `LLM company with name ${companyName} not found`,
        );
      }

      return llm;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Failed to fetch LLM company by name',
      );
    }
  }

  // LLM Model methods
  async createModel(createLlmModelDto: CreateLLMModelDto) {
    try {
      const company = await this.prisma.lLMCompany.findUnique({
        where: { id: createLlmModelDto.llmCompanyId },
      });

      if (!company) {
        throw new BadRequestException('Invalid LLM company ID');
      }

      return await this.prisma.lLMModel.create({
        data: createLlmModelDto,
        select: this.defaultModelSelect,
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === PrismaErrorCode.FOREIGN_KEY_CONSTRAINT_VIOLATION) {
          throw new BadRequestException('Invalid LLM company ID');
        }
      }
      throw new InternalServerErrorException('Failed to create LLM model');
    }
  }

  async findAllModels() {
    try {
      return await this.prisma.lLMModel.findMany({
        select: this.defaultModelSelect,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch LLM models');
    }
  }

  async findOneModel(id: number) {
    try {
      const llmModel = await this.prisma.lLMModel.findUnique({
        where: { id },
        select: this.defaultModelSelect,
      });

      if (!llmModel) {
        throw new NotFoundException(`LLM model with ID ${id} not found`);
      }

      return llmModel;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to fetch LLM model');
    }
  }

  async updateModel(id: number, updateLlmModelDto: UpdateLLMModelDto) {
    try {
      if (updateLlmModelDto.llmCompanyId) {
        const company = await this.prisma.lLMCompany.findUnique({
          where: { id: updateLlmModelDto.llmCompanyId },
        });

        if (!company) {
          throw new BadRequestException('Invalid LLM company ID');
        }
      }

      return await this.prisma.lLMModel.update({
        where: { id },
        data: updateLlmModelDto,
        select: this.defaultModelSelect,
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case PrismaErrorCode.RECORD_NOT_FOUND:
            throw new NotFoundException(`LLM model with ID ${id} not found`);
          case PrismaErrorCode.FOREIGN_KEY_CONSTRAINT_VIOLATION:
            throw new BadRequestException('Invalid LLM company ID');
          default:
            throw new InternalServerErrorException('Database operation failed');
        }
      }
      throw error;
    }
  }

  async removeModel(id: number) {
    try {
      return await this.prisma.lLMModel.delete({
        where: { id },
        select: this.defaultModelSelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === PrismaErrorCode.RECORD_NOT_FOUND) {
          throw new NotFoundException(`LLM model with ID ${id} not found`);
        }
      }
      throw new InternalServerErrorException('Failed to delete LLM model');
    }
  }

  async findOne(id: number) {
    try {
      const llmModel = await this.prisma.lLMModel.findUnique({
        where: { id },
        include: {
          llmCompany: true,
        },
      });

      if (!llmModel) {
        throw new NotFoundException(`LLM Model with ID ${id} not found`);
      }

      return llmModel;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to fetch LLM Model');
    }
  }

  async remove(id: number) {
    try {
      await this.findOne(id);

      await this.prisma.lLMModel.delete({
        where: { id },
      });
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to delete LLM Model');
    }
  }
}
