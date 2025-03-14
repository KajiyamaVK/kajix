import { ApiProperty } from '@nestjs/swagger';
import { LLMCompanyResponseDto } from './llm-company-response.dto';
import { StdLlmTypeResponseDto } from '../../std-llm-type/dto/std-llm-type-response.dto';

export class LLMModelResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the LLM model',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Display name of the LLM model',
    example: 'GPT-4 Turbo',
  })
  displayName: string;

  @ApiProperty({
    description: 'Technical name of the LLM model',
    example: 'gpt-4-turbo-preview',
  })
  modelName: string;

  @ApiProperty({
    description: 'ID of the LLM company this model belongs to',
    example: 1,
  })
  llmCompanyId: number;

  @ApiProperty({
    description: 'ID of the standard LLM type this model belongs to',
    example: 1,
  })
  typeId: number;

  @ApiProperty({
    description: 'Creation date of the LLM model record',
    example: '2023-01-15T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date of the LLM model record',
    example: '2023-01-15T12:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Information about the LLM company',
    type: LLMCompanyResponseDto,
  })
  llmCompany: LLMCompanyResponseDto;

  @ApiProperty({
    description: 'Information about the standard LLM type',
    type: StdLlmTypeResponseDto,
  })
  type: StdLlmTypeResponseDto;
}
