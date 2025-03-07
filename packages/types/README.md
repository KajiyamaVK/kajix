# Kajix Shared Types

This package contains shared TypeScript interfaces and types used across the Kajix monorepo projects.

## Overview

The package is set up using TypeScript project references to enable type sharing between projects while maintaining strong typing and ensuring changes are properly propagated.

## Directory Structure

```
packages/types/
├── src/
│   ├── index.ts        - Main export file
│   ├── user.ts         - User-related types
│   ├── llm.ts          - LLM-related types
│   ├── auth.ts         - Authentication-related types
│   └── dto.ts          - General DTO types
├── dist/               - Compiled output (generated)
├── package.json
├── tsconfig.json
└── README.md           - This file
```

## Available Types

The package includes types for:

- Users (User, CreateUserDto, UpdateUserDto, etc.)
- LLM Companies and Models (LLMCompany, LLMModel, etc.)
- Authentication (LoginDto, TokenPayload, LoginResponse, etc.)
- General DTOs (PaginationParams, PaginatedResponse, ApiErrorResponse, etc.)

## Usage

### Building the Types Package

From the root of the monorepo:

```bash
# Build just the types package
npm run build:types

# Watch for changes during development
npm run watch:types

# Build all projects (types first, then dependent projects)
npm run build:all
```

### Importing Types in Projects

You can import types in two ways:

1. Direct named imports:

```typescript
import { User, CreateUserDto, LoginDto } from "@types";

const user: User = {
  // ...
};
```

2. Namespace imports:

```typescript
import * as SharedTypes from "@types";

const user: SharedTypes.User = {
  // ...
};
```

## Development

### Adding New Types

1. Create or modify type definitions in the appropriate file (or create a new file)
2. Export the types from the file
3. If you created a new file, make sure to export it from `index.ts`
4. Build the types package (`npm run build:types`)
5. The types will be available in other projects

### Updating Existing Types

When you update types:

1. Make your changes
2. Build the types package with `npm run build:types`
3. Rebuild dependent projects to ensure they use the updated types

## Path Aliases

The monorepo is configured with TypeScript path aliases to make imports cleaner:

```typescript
// Instead of:
import { User } from "../../../packages/types/src/user";

// You can use:
import { User } from "@types";
// Or
import { User } from "@types/user";
```
