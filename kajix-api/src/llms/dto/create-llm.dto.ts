import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLLMDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
} 