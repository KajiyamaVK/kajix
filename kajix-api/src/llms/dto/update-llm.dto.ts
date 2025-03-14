import { PartialType } from '@nestjs/mapped-types';
import { CreateLLMDto } from './create-llm.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLLMDto extends PartialType(CreateLLMDto) {}
