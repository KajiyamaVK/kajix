# Kajix API

A robust NestJS-based API service with TypeScript, Prisma ORM, and comprehensive testing setup.

## 🚀 Features

- NestJS framework with TypeScript
- PostgreSQL database with Prisma ORM
- Docker containerization
- JWT authentication
- Redis caching
- E2E and unit testing setup
- Code quality tools (ESLint, Prettier)
- Swagger API documentation
- Automated database seeding
- Continuous Integration ready

## 📋 Prerequisites

- Node.js (version specified in `.nvmrc`)
- Docker and Docker Compose
- pnpm/npm (package manager)
- PostgreSQL (if running locally)

## 🛠 Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd kajix-api
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Start the development database:

```bash
docker-compose up -d postgres
```

5. Run database migrations:

```bash
pnpm db:migrate
```

6. Generate Prisma client:

```bash
pnpm prisma:generate
```

## 🚀 Development

Start the development server:

```bash
pnpm dev
```

The API will be available at `http://localhost:3000`.

### 📝 Available Scripts

- `pnpm build` - Build the application
- `pnpm start` - Start the production server
- `pnpm dev` - Start development server with hot reload
- `pnpm test` - Run unit tests
- `pnpm test:e2e` - Run end-to-end tests
- `pnpm test:cov` - Generate test coverage report
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm db:migrate` - Run database migrations
- `pnpm db:reset` - Reset database
- `pnpm seed` - Run database seeders

## 🐳 Docker Setup

The project includes Docker configuration for both development and test databases:

- Development database: `localhost:5432`
- Test database: `localhost:5433`

Start all services:

```bash
docker-compose up -d
```

## 🧪 Testing

The project includes both unit and E2E tests:

1. Unit tests:

```bash
pnpm test
```

2. E2E tests:

```bash
pnpm test:e2e
```

3. Run all tests with coverage:

```bash
pnpm test:all
```

## 📚 API Documentation

Once the server is running, access the Swagger documentation at:
`http://localhost:3000/api`

## 🔒 Environment Variables

Key environment variables needed (check `.env.example` for all options):

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `REDIS_URL` - Redis connection string
- `PORT` - API server port

## 📦 Project Structure

```
kajix-api/
├── src/                # Source code
├── test/              # Test files
├── prisma/            # Database migrations and schema
├── dist/              # Compiled output
└── layouts/           # Layout templates
```

## 📝 TODO List

[ ] Refresh Token Blacklist
[ ] Use the generate token function to generate a token to send in the Confirm Email body
[ ] Validate token and mark as used in the DB
[ ] save the user in the db after token validation

[ ] Make a user for n8n
[ ]
