import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { StdLlmTypeService } from './std-llm-type.service';
import { CreateStdLlmTypeDto } from './dto/create-std-llm-type.dto';
import { UpdateStdLlmTypeDto } from './dto/update-std-llm-type.dto';
import { StdLlmTypeResponseDto } from './dto/std-llm-type-response.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('std-llm-types')
@Controller('std-llm-types')
@UseGuards(JwtAuthGuard)
export class StdLlmTypeController {
  constructor(private readonly stdLlmTypeService: StdLlmTypeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new LLM type' })
  @ApiResponse({
    status: 201,
    description: 'The LLM type has been successfully created.',
    type: StdLlmTypeResponseDto,
  })
  create(
    @Body() createStdLlmTypeDto: CreateStdLlmTypeDto,
  ): Promise<StdLlmTypeResponseDto> {
    return this.stdLlmTypeService.create(createStdLlmTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all LLM types' })
  @ApiResponse({
    status: 200,
    description: 'Returns all LLM types',
    type: [StdLlmTypeResponseDto],
  })
  findAll(): Promise<StdLlmTypeResponseDto[]> {
    return this.stdLlmTypeService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active LLM types' })
  @ApiResponse({
    status: 200,
    description: 'Returns all active LLM types',
    type: [StdLlmTypeResponseDto],
  })
  findActiveTypes(): Promise<StdLlmTypeResponseDto[]> {
    return this.stdLlmTypeService.findActiveTypes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific LLM type by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the LLM type with the specified ID',
    type: StdLlmTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'LLM type not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StdLlmTypeResponseDto> {
    return this.stdLlmTypeService.findOne(id);
  }

  @Get(':id/models')
  @ApiOperation({
    summary: 'Get all models associated with a specific LLM type',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all models associated with the specified LLM type',
  })
  @ApiResponse({ status: 404, description: 'LLM type not found' })
  findModelsWithType(@Param('id', ParseIntPipe) id: number): Promise<any[]> {
    return this.stdLlmTypeService.findModelsWithType(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific LLM type' })
  @ApiResponse({
    status: 200,
    description: 'The LLM type has been successfully updated.',
    type: StdLlmTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'LLM type not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStdLlmTypeDto: UpdateStdLlmTypeDto,
  ): Promise<StdLlmTypeResponseDto> {
    return this.stdLlmTypeService.update(id, updateStdLlmTypeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific LLM type' })
  @ApiResponse({
    status: 200,
    description: 'The LLM type has been successfully deleted.',
    type: StdLlmTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'LLM type not found' })
  remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StdLlmTypeResponseDto> {
    return this.stdLlmTypeService.remove(id);
  }
}
