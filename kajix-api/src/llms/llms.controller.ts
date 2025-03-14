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
  HttpStatus,
} from '@nestjs/common';
import { LLMsService } from './llms.service';
import { CreateLLMDto } from './dto/create-llm.dto';
import { UpdateLLMDto } from './dto/update-llm.dto';
import { CreateLLMModelDto } from './dto/create-llm-model.dto';
import { UpdateLLMModelDto } from './dto/update-llm-model.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LLMCompanyResponseDto } from './dto/llm-company-response.dto';
import { LLMModelResponseDto } from './dto/llm-model-response.dto';

@ApiTags('LLMs')
@ApiBearerAuth()
@Controller('llms')
@UseGuards(JwtAuthGuard)
export class LLMsController {
  constructor(private readonly llmsService: LLMsService) {}

  // LLM Company endpoints
  @Post('companies')
  @ApiOperation({ summary: 'Create a new LLM company' })
  @ApiBody({ type: CreateLLMDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The LLM company has been successfully created.',
    type: LLMCompanyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid data provided.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'LLM company already exists.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  createCompany(@Body() createLlmDto: CreateLLMDto) {
    return this.llmsService.createCompany(createLlmDto);
  }

  @Get('companies')
  @ApiOperation({ summary: 'Get all LLM companies' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all LLM companies.',
    type: [LLMCompanyResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  findAllCompanies() {
    return this.llmsService.findAllCompanies();
  }

  @Get('companies/:id')
  @ApiOperation({ summary: 'Get a specific LLM company by ID' })
  @ApiParam({ name: 'id', description: 'LLM company ID', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The LLM company details.',
    type: LLMCompanyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'LLM company not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  findOneCompany(@Param('id', ParseIntPipe) id: number) {
    return this.llmsService.findOneCompany(id);
  }

  @Get('companies/name/:companyName')
  @ApiOperation({ summary: 'Get a specific LLM company by name' })
  @ApiParam({
    name: 'companyName',
    description: 'LLM company name',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The LLM company details.',
    type: LLMCompanyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'LLM company not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  findCompanyByName(@Param('companyName') companyName: string) {
    return this.llmsService.findCompanyByName(companyName);
  }

  @Patch('companies/:id')
  @ApiOperation({ summary: 'Update an LLM company' })
  @ApiParam({ name: 'id', description: 'LLM company ID', type: 'number' })
  @ApiBody({ type: UpdateLLMDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The LLM company has been successfully updated.',
    type: LLMCompanyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'LLM company not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid data provided.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  updateCompany(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLlmDto: UpdateLLMDto,
  ) {
    return this.llmsService.updateCompany(id, updateLlmDto);
  }

  @Delete('companies/:id')
  @ApiOperation({ summary: 'Delete an LLM company' })
  @ApiParam({ name: 'id', description: 'LLM company ID', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The LLM company has been successfully deleted.',
    type: LLMCompanyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'LLM company not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  removeCompany(@Param('id', ParseIntPipe) id: number) {
    return this.llmsService.removeCompany(id);
  }

  // LLM Model endpoints
  @Post('models')
  @ApiOperation({ summary: 'Create a new LLM model' })
  @ApiBody({ type: CreateLLMModelDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The LLM model has been successfully created.',
    type: LLMModelResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid data provided.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'LLM model already exists or company not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  createModel(@Body() createLlmModelDto: CreateLLMModelDto) {
    return this.llmsService.createModel(createLlmModelDto);
  }

  @Get('models')
  @ApiOperation({ summary: 'Get all LLM models' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all LLM models.',
    type: [LLMModelResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  findAllModels() {
    return this.llmsService.findAllModels();
  }

  @Get('models/:id')
  @ApiOperation({ summary: 'Get a specific LLM model by ID' })
  @ApiParam({ name: 'id', description: 'LLM model ID', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The LLM model details.',
    type: LLMModelResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'LLM model not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  findOneModel(@Param('id', ParseIntPipe) id: number) {
    return this.llmsService.findOneModel(id);
  }

  @Patch('models/:id')
  @ApiOperation({ summary: 'Update an LLM model' })
  @ApiParam({ name: 'id', description: 'LLM model ID', type: 'number' })
  @ApiBody({ type: UpdateLLMModelDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The LLM model has been successfully updated.',
    type: LLMModelResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'LLM model not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid data provided.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Company reference not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  updateModel(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLlmModelDto: UpdateLLMModelDto,
  ) {
    return this.llmsService.updateModel(id, updateLlmModelDto);
  }

  @Delete('models/:id')
  @ApiOperation({ summary: 'Delete an LLM model' })
  @ApiParam({ name: 'id', description: 'LLM model ID', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The LLM model has been successfully deleted.',
    type: LLMModelResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'LLM model not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
  })
  removeModel(@Param('id', ParseIntPipe) id: number) {
    return this.llmsService.removeModel(id);
  }
}
