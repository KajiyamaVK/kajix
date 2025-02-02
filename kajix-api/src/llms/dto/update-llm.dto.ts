import { PartialType } from '@nestjs/mapped-types';
import { CreateLLMDto } from './create-llm.dto';

export class UpdateLLMDto extends PartialType(CreateLLMDto) {} 