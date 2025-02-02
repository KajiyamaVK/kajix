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
import { LLMsService } from './llms.service';
import { CreateLLMDto } from './dto/create-llm.dto';
import { UpdateLLMDto } from './dto/update-llm.dto';
import { CreateLLMModelDto } from './dto/create-llm-model.dto';
import { UpdateLLMModelDto } from './dto/update-llm-model.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('llms')
@UseGuards(JwtAuthGuard)
export class LLMsController {
  constructor(private readonly llmsService: LLMsService) {}

  // LLM Company endpoints
  @Post('companies')
  createCompany(@Body() createLlmDto: CreateLLMDto) {
    return this.llmsService.createCompany(createLlmDto);
  }

  @Get('companies')
  findAllCompanies() {
    return this.llmsService.findAllCompanies();
  }

  @Get('companies/:id')
  findOneCompany(@Param('id', ParseIntPipe) id: number) {
    return this.llmsService.findOneCompany(id);
  }

  @Get('companies/name/:companyName')
  findCompanyByName(@Param('companyName') companyName: string) {
    return this.llmsService.findCompanyByName(companyName);
  }

  @Patch('companies/:id')
  updateCompany(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLlmDto: UpdateLLMDto,
  ) {
    return this.llmsService.updateCompany(id, updateLlmDto);
  }

  @Delete('companies/:id')
  removeCompany(@Param('id', ParseIntPipe) id: number) {
    return this.llmsService.removeCompany(id);
  }

  // LLM Model endpoints
  @Post('models')
  createModel(@Body() createLlmModelDto: CreateLLMModelDto) {
    return this.llmsService.createModel(createLlmModelDto);
  }

  @Get('models')
  findAllModels() {
    return this.llmsService.findAllModels();
  }

  @Get('models/:id')
  findOneModel(@Param('id', ParseIntPipe) id: number) {
    return this.llmsService.findOneModel(id);
  }

  @Patch('models/:id')
  updateModel(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLlmModelDto: UpdateLLMModelDto,
  ) {
    return this.llmsService.updateModel(id, updateLlmModelDto);
  }

  @Delete('models/:id')
  removeModel(@Param('id', ParseIntPipe) id: number) {
    return this.llmsService.removeModel(id);
  }
} 