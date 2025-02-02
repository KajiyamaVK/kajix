import { IsNotEmpty, IsString, IsInt } from 'class-validator';

export class CreateLLMModelDto {
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsString()
  @IsNotEmpty()
  modelName: string;

  @IsInt()
  @IsNotEmpty()
  llmCompanyId: number;
} 