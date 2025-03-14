import { IsNotEmpty, IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLLMModelDto {
  @ApiProperty({
    description: 'Display name of the LLM model',
    example: 'GPT-4 Turbo',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @ApiProperty({
    description: 'Technical name of the LLM model',
    example: 'gpt-4-turbo-preview',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  modelName: string;

  @ApiProperty({
    description: 'ID of the LLM company this model belongs to',
    example: 1,
    required: true,
  })
  @IsInt()
  @IsNotEmpty()
  llmCompanyId: number;

  @ApiProperty({
    description: 'ID of the standard LLM type this model belongs to',
    example: 1,
    required: true,
  })
  @IsInt()
  @IsNotEmpty()
  typeId: number;
}
