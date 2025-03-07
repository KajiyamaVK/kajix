# Kajix Monorepo

This monorepo contains multiple projects that share code and types, built with modern JavaScript/TypeScript technologies.

## Projects

- **kajix-api**: Backend API built with NestJS, Prisma ORM, and Express
- **kajix-ui**: Frontend UI built with Next.js 15, React 19, and Shadcn UI
- **packages/types**: Shared TypeScript types used across projects

## Tech Stack

### Root Monorepo

- **Package Management**: npm workspaces for cross-project dependencies
- **TypeScript**: Project references for type sharing and incremental builds
- **Code Quality**: ESLint, Prettier, Husky for pre-commit hooks
- **CSS**: Tailwind CSS 4 for styling

### kajix-api (Backend)

- **Framework**: NestJS 11 (Express-based Node.js framework)
- **Database**: Prisma ORM for database access and migrations
- **Authentication**: Passport.js with JWT strategy
- **Caching**: Redis via @nestjs/cache-manager and ioredis
- **Testing**: Jest for unit and E2E tests
- **Utilities**:
  - Nodemailer for email functionality
  - class-validator & class-transformer for DTO validation
  - Faker.js for generating test data

### kajix-ui (Frontend)

- **Framework**: Next.js 15 with App Router
- **UI Libraries**:
  - React 19
  - Shadcn UI (built on Radix UI primitives)
  - Tailwind CSS for styling
- **Form Handling**:
  - React Hook Form
  - Zod for validation
- **State Management**:
  - React Context API
  - Potentially Redux Toolkit (based on root dependencies)
- **Internationalization**: i18next with react-i18next
- **UI Components**:
  - Radix UI primitives
  - Lucide React for icons
  - Tailwind animations and merge utilities
  - Various specialized components (Embla Carousel, DayPicker, etc.)

### packages/types (Shared)

- **Pure TypeScript** package for shared interfaces, types, and DTOs
- Compiled to JavaScript for runtime use

## Project References Setup

The monorepo uses TypeScript project references to share types between projects. This approach provides several benefits:

- **Type-safety**: Changes to shared types are automatically propagated to consuming projects
- **Build performance**: Incremental builds only rebuild what's needed
- **IDE integration**: Better IntelliSense and navigation between projects

## Getting Started

1. Install dependencies:

```bash
# From the root
npm install
```

2. Build the shared types package:

```bash
npm run build:types
```

3. Build all projects:

```bash
npm run build:all
```

4. Run the projects individually:

```bash
# API
cd kajix-api
npm run start:dev

# UI
cd kajix-ui
npm run dev
```

## Development Workflow

### Working with Shared Types

1. Make changes to types in `packages/types/src/`
2. Build the types package:

```bash
npm run build:types
# Or watch for changes:
npm run watch:types
```

3. Import types in your projects:

```typescript
// Direct import
import { User, CreateUserDto } from "@kajix/types";

// Namespace import
import * as SharedTypes from "@kajix/types";
```

### Adding New Types

1. Add new interfaces/types to the appropriate file in `packages/types/src/`
2. If creating a new category of types, create a new file and export it from `index.ts`
3. Build the types package with `npm run build:types`

## Architecture

The monorepo uses:

- TypeScript project references for type sharing
- Path aliases for clean imports
- Workspace setup for managing dependencies
- Modern tooling: ESLint, Prettier, Husky

### Key Configuration Files

- `tsconfig.references.json`: Root configuration for project references
- `package.json`: Workspace and script configuration
- `.eslintrc.json` & `eslint.config.mjs`: ESLint configuration
- `packages/types/tsconfig.json`: Type package configuration
- Project-specific tsconfig.json files with references

## Project Structure

```
kajix/
├── packages/
│   └── types/           - Shared TypeScript types
│       ├── src/         - Type definitions
│       ├── dist/        - Compiled types (generated)
│       └── tsconfig.json - TypeScript configuration
├── kajix-api/           - Backend API (NestJS)
│   ├── src/             - API source code
│   │   ├── auth/        - Authentication module
│   │   ├── users/       - User management module
│   │   ├── llms/        - Language model module
│   │   ├── prisma/      - Prisma ORM setup
│   │   ├── redis/       - Redis cache setup
│   │   └── mail/        - Email functionality
│   ├── prisma/          - Database schema and migrations
│   └── tsconfig.json    - TypeScript configuration
├── kajix-ui/            - Frontend UI (Next.js)
│   ├── app/             - Next.js App Router
│   ├── components/      - React components
│   │   ├── ui/          - Shadcn UI components
│   │   ├── theme/       - Theme components
│   │   ├── i18n/        - Internationalization components
│   │   └── login/       - Authentication UI
│   ├── hooks/           - Custom React hooks
│   ├── lib/             - Utility functions
│   ├── styles/          - Global styles
│   └── tsconfig.json    - TypeScript configuration
├── tsconfig.references.json  - Project references configuration
└── package.json         - Root package config with workspaces
```

## Code Quality and Standards

This monorepo uses:

- ESLint for code linting
- Prettier for code formatting
- Husky for Git hooks
- TypeScript for type checking across all projects
