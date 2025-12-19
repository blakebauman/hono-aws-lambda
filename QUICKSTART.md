# Quick Start Guide

This guide will help you get the Hono AWS Lambda project up and running quickly.

## Prerequisites

### Option 1: Docker Development (Recommended)

1. **Docker** and **Docker Compose**
   - Install [Docker Desktop](https://www.docker.com/products/docker-desktop) or Docker Engine + Compose
   - Verify installation: `docker --version` and `docker compose version`

### Option 2: Local Development

1. **Bun** (>= 1.0.0)
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **AWS CLI** configured (optional, only for AWS deployments)
   ```bash
   aws configure
   ```

3. **PostgreSQL** (for local development)
   - Install PostgreSQL locally or use Docker:
     ```bash
     docker run --name postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=honoapp -p 5432:5432 -d postgres:17
     ```

4. **Redis** (optional, for local development)
   ```bash
   docker run --name redis -p 6379:6379 -d redis:latest
   ```

## Setup Steps

### Docker Development Setup (Recommended)

This is the easiest way to get started with all services containerized.

#### 1. Clone and Navigate

```bash
git clone <repository-url>
cd hono-aws-lambda
```

#### 2. Configure Environment Variables

Create a `.env` file from the example template:

```bash
# Copy the example template
cp env.example .env

# Edit .env and update values as needed
# For Docker, the connection strings are already pre-configured
```

**Important**: Generate a secure `BETTER_AUTH_SECRET` and update it in `.env`:
```bash
openssl rand -base64 32
```

#### 3. Automated Setup (Recommended)

Use the automated setup command:

```bash
# This will:
# - Create .env from template (if it doesn't exist)
# - Install dependencies
# - Start Docker services
# - Show service status
just setup
```

Then update `BETTER_AUTH_SECRET` in `.env` if needed:
```bash
openssl rand -base64 32
```

#### 4. Manual Setup (Alternative)

If you prefer manual setup:

```bash
# Start PostgreSQL, Redis, and API in detached mode
docker compose up -d

# Or run in foreground to see logs
docker compose up
```

#### 5. Run Database Migrations

```bash
# Install dependencies locally (for running migrations)
bun install

# Run migrations (connects to containerized database)
just db:migrate
```

#### 6. Verify Setup

```bash
# Quick verification (checks all services)
just verify

# Or manually check
docker compose ps
curl http://localhost:3000/api/health
```

#### 6. Access Services

- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/docs
- **PostgreSQL**: localhost:5432 (user: `honoapp`, password: `honoapp_password`, db: `honoapp`)
- **Redis**: localhost:6379

#### 7. Development Workflow

- **Code changes**: Automatically reflected via hot-reload (no container restart needed)
- **View logs**: `docker compose logs -f api`
- **Restart services**: `docker compose restart api`
- **Stop services**: `docker compose down`
- **Stop and remove volumes**: `docker compose down -v` (⚠️ deletes database data)

### Local Development Setup (Without Docker)

#### 1. Install Dependencies

```bash
bun install
```

#### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/honoapp
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters-long
BETTER_AUTH_URL=http://localhost:3000
AWS_REGION=us-east-1
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:3000
```

#### 3. Set Up Database

```bash
# Generate migrations
just db:generate

# Run migrations
just db:migrate
```

#### 4. Start Development Server

```bash
just dev
```

The API will be available at `http://localhost:3000`

#### 5. Test the API

```bash
# Health check
curl http://localhost:3000/api/health

# API documentation
open http://localhost:3000/docs
```

## Deploying to AWS

### First Time Setup

1. **Bootstrap CDK** (one-time setup per AWS account/region):
   ```bash
   just cdk:bootstrap
   ```

2. **Configure AWS Account**:
   - Set `AWS_ACCOUNT_ID` in `.env` or export it:
     ```bash
     export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
     ```

### Deploy to Staging

```bash
# Synthesize stacks (preview changes)
just cdk:synth

# Deploy to staging
just deploy:staging
```

### Deploy to Production

```bash
# Deploy to production (requires approval)
just deploy:prod
```

## Project Structure

```
packages/
├── api/                    # Hono API application
│   ├── src/
│   │   ├── app.ts         # Main Hono app
│   │   ├── index.ts       # Lambda handler
│   │   ├── dev.ts         # Development server
│   │   ├── lib/           # Core libraries
│   │   ├── middleware/    # Custom middleware
│   │   └── routes/        # API routes
│   └── package.json
├── infrastructure/        # AWS CDK infrastructure
│   ├── src/
│   │   ├── app.ts         # CDK app entry point
│   │   ├── stacks/        # CDK stacks
│   │   └── lib/           # CDK constructs and utilities
│   └── package.json
└── shared/                # Shared code
    └── src/
        └── db/            # Database schemas
```

## Common Tasks

### Setup & Verification

```bash
just setup                    # Automated initial setup
just verify                   # Verify all services are healthy
just test:db                  # Test database connection
just test:redis               # Test Redis connection
```

### Docker Development

```bash
# Using Just commands (recommended)
just docker:up                # Start all services
just docker:up:d              # Start in background
just docker:down              # Stop all services
just docker:down:v            # Stop and remove volumes
just docker:logs              # Follow API logs
just docker:logs:all          # Follow all service logs
just docker:restart           # Restart API service
just docker:ps                # Check service status
just docker:shell             # Access API container shell
just docker:build             # Rebuild containers
just docker:clean             # Clean up everything

# Or use docker compose directly
docker compose up
docker compose up -d
docker compose down
docker compose logs -f api
docker compose ps
```

### Development (Local)

```bash
just dev              # Start dev server
just build            # Build all packages
just lint             # Run linter
just format           # Format code
just type-check       # Type check
just test             # Run tests
just test:watch       # Watch mode tests
just test:coverage    # Test coverage
```

### Database

```bash
just db:generate      # Generate migrations
just db:migrate       # Run migrations (works with Docker or local DB)
```

### Infrastructure

```bash
just cdk:synth         # Synthesize CDK
just cdk:diff          # Show diff
just cdk:bootstrap     # Bootstrap CDK
just deploy:staging    # Deploy staging
just deploy:prod       # Deploy production
```

## Troubleshooting

### Docker Issues

**Services won't start:**
- Check Docker is running: `docker ps`
- Check port conflicts: `lsof -i :3000 -i :5432 -i :6379`
- View logs: `docker compose logs`

**API container keeps restarting:**
- Check logs: `docker compose logs api`
- Verify environment variables in `.env`
- Ensure database and Redis are healthy: `docker compose ps`

**Hot-reload not working:**
- Verify volume mounts: `docker compose config`
- Check file permissions
- Restart API container: `docker compose restart api`

**Database connection errors:**
- Verify PostgreSQL is healthy: `docker compose ps postgres`
- Check connection string uses service name `postgres` (not `localhost`) in Docker
- Test connection: `docker compose exec postgres psql -U honoapp -d honoapp`

### Database Connection Issues

**With Docker:**
- Verify PostgreSQL is running: `docker compose ps postgres`
- Connection string should use `postgres` as hostname (not `localhost`)
- Test connection: `docker compose exec postgres psql -U honoapp -d honoapp`

**Without Docker:**
- Verify PostgreSQL is running: `pg_isready`
- Check connection string format: `postgresql://user:password@host:port/database`
- Ensure database exists: `createdb honoapp`

### Redis Connection Issues

**With Docker:**
- Verify Redis is running: `docker compose ps redis`
- Connection string should use `redis` as hostname (not `localhost`)
- Test connection: `docker compose exec redis redis-cli ping`

**Without Docker:**
- Verify Redis is running: `redis-cli ping`
- Check connection string: `redis://localhost:6379`
- Redis is optional - the app will work without it (rate limiting will fail open)

### AWS Deployment Issues

- Verify AWS credentials: `aws sts get-caller-identity`
- Check CDK bootstrap: `aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE | grep CDK`
- Review CloudFormation events in AWS Console

### Type Errors

- Run `just type-check` to see all type errors
- Ensure all dependencies are installed: `bun install`
- Clear TypeScript cache: `rm -rf packages/*/dist packages/*/.tsbuildinfo`

## Next Steps

1. **Customize API Routes**: Edit `packages/api/src/routes/`
2. **Add Database Tables**: Update `packages/shared/src/db/schema.ts`
3. **Configure Infrastructure**: Edit `packages/infrastructure/src/stacks/`
4. **Set Up CI/CD**: Configure GitHub Actions workflows
5. **Add Monitoring**: Set up CloudWatch dashboards and alarms

## Resources

- [Hono Documentation](https://hono.dev)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Better Auth Documentation](https://www.better-auth.com)
- [LangChain Documentation](https://js.langchain.com)

