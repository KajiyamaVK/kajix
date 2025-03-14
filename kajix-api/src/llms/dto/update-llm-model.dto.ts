import { PartialType } from '@nestjs/mapped-types';
import { CreateLLMModelDto } from './create-llm-model.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLLMModelDto extends PartialType(CreateLLMModelDto) {}
