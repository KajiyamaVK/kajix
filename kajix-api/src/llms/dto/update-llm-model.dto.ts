import { PartialType } from '@nestjs/mapped-types';
import { CreateLLMModelDto } from './create-llm-model.dto';

export class UpdateLLMModelDto extends PartialType(CreateLLMModelDto) {} 