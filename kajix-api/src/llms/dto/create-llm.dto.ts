import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLLMDto {
  @ApiProperty({
    description: 'Name of the LLM company',
    example: 'OpenAI',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({
    description: 'Indicates if the LLM company is active',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
