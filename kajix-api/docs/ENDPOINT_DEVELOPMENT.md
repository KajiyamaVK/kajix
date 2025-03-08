# Kajix API Endpoint Development Guide

This guide provides a comprehensive walkthrough for developing new endpoints in the Kajix API, following our established patterns and best practices.

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Step-by-Step Guide](#step-by-step-guide)
4. [Testing](#testing)
5. [Best Practices](#best-practices)
6. [Examples](#examples)

## Overview

When developing a new endpoint in Kajix API, you'll need to create or modify the following components:

1. Types/DTOs (in shared types package)
2. Database migrations (if needed)
3. Module
4. Controller
5. Service
6. Tests (unit and e2e)

## Project Structure

New feature components should be organized as follows:

```
kajix-api/
├── src/
│   └── feature-name/
│       ├── dto/
│       │   ├── create-feature.dto.ts
│       │   ├── update-feature.dto.ts
│       │   └── feature-response.dto.ts
│       ├── entities/
│       │   └── feature.entity.ts
│       ├── feature.controller.ts
│       ├── feature.service.ts
│       ├── feature.module.ts
│       └── feature.constants.ts
├── test/
│   └── feature-name/
│       ├── feature.controller.spec.ts
│       ├── feature.service.spec.ts
│       └── feature.e2e-spec.ts
└── prisma/
    └── migrations/
        └── YYYYMMDDHHMMSS_feature_name.sql
```

## Step-by-Step Guide

### 1. Define Types

First, add your types to the shared types package:

```typescript
// packages/types/src/feature-name/index.ts

export interface Feature {
  id: string;
  name: string;
  // ... other properties
}

export interface CreateFeatureDto {
  name: string;
  // ... other properties
}

export interface UpdateFeatureDto {
  name?: string;
  // ... other properties
}
```

### 2. Database Schema Changes

If your feature requires database changes:

1. Update the Prisma schema:

```prisma
// prisma/schema.prisma

model Feature {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // ... other fields
}
```

2. Generate the migration:

```bash
npx prisma migrate dev --name feature_name
```

### 3. Create the Module

```typescript
// src/feature-name/feature.module.ts

import { Module } from '@nestjs/common';
import { FeatureController } from './feature.controller';
import { FeatureService } from './feature.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeatureController],
  providers: [FeatureService],
  exports: [FeatureService], // if needed by other modules
})
export class FeatureModule {}
```

### 4. Create the Service

```typescript
// src/feature-name/feature.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Feature, CreateFeatureDto, UpdateFeatureDto } from '@kajix/types';

@Injectable()
export class FeatureService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFeatureDto): Promise<Feature> {
    return this.prisma.feature.create({
      data: dto,
    });
  }

  async findAll(): Promise<Feature[]> {
    return this.prisma.feature.findMany();
  }

  async findOne(id: string): Promise<Feature> {
    return this.prisma.feature.findUnique({
      where: { id },
    });
  }

  async update(id: string, dto: UpdateFeatureDto): Promise<Feature> {
    return this.prisma.feature.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<Feature> {
    return this.prisma.feature.delete({
      where: { id },
    });
  }
}
```

### 5. Create the Controller

```typescript
// src/feature-name/feature.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FeatureService } from './feature.service';
import { Feature, CreateFeatureDto, UpdateFeatureDto } from '@kajix/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('features')
@UseGuards(JwtAuthGuard) // If authentication is required
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @Post()
  create(@Body() createFeatureDto: CreateFeatureDto): Promise<Feature> {
    return this.featureService.create(createFeatureDto);
  }

  @Get()
  findAll(): Promise<Feature[]> {
    return this.featureService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Feature> {
    return this.featureService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFeatureDto: UpdateFeatureDto,
  ): Promise<Feature> {
    return this.featureService.update(id, updateFeatureDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Feature> {
    return this.featureService.remove(id);
  }
}
```

## Testing

### 1. Unit Tests

```typescript
// test/feature-name/feature.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { FeatureService } from '../../src/feature-name/feature.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('FeatureService', () => {
  let service: FeatureService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureService,
        {
          provide: PrismaService,
          useValue: {
            feature: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<FeatureService>(FeatureService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more test cases
});
```

### 2. E2E Tests

```typescript
// test/feature-name/feature.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('FeatureController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/features (POST)', () => {
    return request(app.getHttpServer())
      .post('/features')
      .send({
        name: 'Test Feature',
      })
      .expect(201);
  });

  // Add more test cases
});
```

## Best Practices

1. **Type Safety**

   - Always use TypeScript types/interfaces
   - Avoid using `any`
   - Use proper DTO validation

2. **Error Handling**

   - Use NestJS built-in exception filters
   - Create custom exceptions when needed
   - Properly handle async/await

3. **Documentation**

   - Use Swagger decorators for API documentation
   - Add JSDoc comments for complex functions
   - Keep README updated

4. **Testing**

   - Write unit tests for services
   - Write e2e tests for endpoints
   - Use proper mocking
   - Aim for high test coverage

5. **Security**
   - Use proper guards
   - Validate input data
   - Follow OWASP guidelines

## Examples

### Example: Error Handling

```typescript
// src/feature-name/feature.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class FeatureService {
  async findOne(id: string): Promise<Feature> {
    const feature = await this.prisma.feature.findUnique({
      where: { id },
    });

    if (!feature) {
      throw new NotFoundException(`Feature with ID ${id} not found`);
    }

    return feature;
  }
}
```

### Example: Validation

```typescript
// src/feature-name/dto/create-feature.dto.ts

import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateFeatureDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;
}
```

### Example: Swagger Documentation

```typescript
// src/feature-name/feature.controller.ts

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('features')
@Controller('features')
export class FeatureController {
  @ApiOperation({ summary: 'Create new feature' })
  @ApiResponse({ status: 201, description: 'Feature created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post()
  create(@Body() createFeatureDto: CreateFeatureDto) {
    return this.featureService.create(createFeatureDto);
  }
}
```

Remember to:

1. Follow the established project structure
2. Write comprehensive tests
3. Add proper documentation
4. Handle errors appropriately
5. Follow TypeScript best practices
6. Use proper validation
7. Keep security in mind
