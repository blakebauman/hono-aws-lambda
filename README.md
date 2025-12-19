# Hono AWS Lambda Production Setup

A production-ready Hono REST API with Bun runtime, AWS Lambda deployment, featuring:

- **Framework**: Hono with AWS Lambda adapter
- **Runtime**: Bun
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth
- **AI/LLM**: LangChain, LangGraph, and LangSmith
- **Infrastructure**: AWS CDK v2 (TypeScript)
- **CI/CD**: GitHub Actions
- **Security**: Hardened with rate limiting, input sanitization, security headers
- **Performance**: Caching, CDN, connection pooling, optimization
- **Monitoring**: CloudWatch, X-Ray, LangSmith

## Architecture

```
packages/
├── api/              # Hono API application
├── infrastructure/   # AWS CDK infrastructure code
└── shared/           # Shared types and utilities
```

## Getting Started

See [QUICKSTART.md](./QUICKSTART.md) for a detailed quick start guide.

### Prerequisites

**Docker Development (Recommended):**
- [Docker](https://www.docker.com/products/docker-desktop) and Docker Compose
- [Bun](https://bun.sh) >= 1.0.0 (for running migrations locally)

**Local Development:**
- [Bun](https://bun.sh) >= 1.0.0
- AWS CLI configured (optional, only for AWS deployments)
- PostgreSQL 17 (for local development)
- Redis (for local development, optional)

### Installation

#### Docker Development (Recommended)

**Quick Setup:**
```bash
# Automated setup (creates .env, installs deps, starts services)
just setup

# Update BETTER_AUTH_SECRET in .env if needed
openssl rand -base64 32

# Run migrations
just db:migrate

# Verify everything is working
just verify
```

**Manual Setup:**
```bash
# 1. Create .env file from template
cp env.example .env

# 2. Start all services (PostgreSQL, Redis, API)
docker compose up -d

# 3. Install dependencies locally (for running migrations)
bun install

# 4. Run database migrations
just db:migrate

# 5. Verify setup
just verify
```

#### Local Development

```bash
# Install dependencies
bun install

# Create .env file (see Environment Variables section below)
# Copy the example and update with your values

# Start development server
just dev

# Or use bun directly
bun run dev
```

### Database

```bash
# Generate migrations
just db:generate

# Run migrations
just db:migrate
```

### Infrastructure

```bash
# Bootstrap CDK (first time only)
just cdk:bootstrap

# Synthesize stacks
just cdk:synth

# Deploy to staging
just deploy:staging

# Deploy to production
just deploy:prod
```

## Available Commands

See `Justfile` for all available commands:

### Setup & Verification
- `just setup` - Automated initial setup (creates .env, installs deps, starts services)
- `just verify` - Verify all services are healthy and accessible
- `just test:db` - Test database connection
- `just test:redis` - Test Redis connection

### Docker Development
- `just docker:up` - Start all services (foreground)
- `just docker:up:d` - Start all services (background)
- `just docker:down` - Stop all services
- `just docker:down:v` - Stop services and remove volumes
- `just docker:logs` - Follow API logs
- `just docker:logs:all` - Follow all service logs
- `just docker:restart` - Restart API service
- `just docker:ps` - Check service status
- `just docker:shell` - Access API container shell
- `just docker:build` - Rebuild containers
- `just docker:clean` - Clean up containers and volumes

### Development
- `just dev` - Start development server (local)
- `just build` - Build all packages
- `just lint` - Run linter
- `just format` - Format code
- `just type-check` - Type check all packages

### Testing
- `just test` - Run tests
- `just test:watch` - Run tests in watch mode
- `just test:coverage` - Run tests with coverage

### Database
- `just db:migrate` - Run database migrations
- `just db:generate` - Generate Drizzle migrations

### Infrastructure
- `just cdk:synth` - Synthesize CDK stacks
- `just cdk:diff` - Show CDK diff
- `just cdk:bootstrap` - Bootstrap CDK (first time only)
- `just deploy:staging` - Deploy to staging
- `just deploy:prod` - Deploy to production

### Cache & Performance
- `just cache:clear` - Clear application cache
- `just cache:warm` - Warm up cache
- `just perf:test` - Run performance tests
- `just metrics:view` - View performance metrics

## Project Structure

- `packages/api/` - Main Hono API application
- `packages/infrastructure/` - AWS CDK v2 infrastructure
- `packages/shared/` - Shared types and utilities

## Security

This project implements comprehensive security features:

- Rate limiting (per IP, per user, per endpoint)
- Input validation and sanitization
- Security headers (CSP, HSTS, etc.)
- CSRF protection
- Secrets management via AWS Secrets Manager
- Authentication with Better Auth
- RBAC and permission-based access control

## Performance

Optimizations include:

- HTTP caching with ETags and Cache-Control
- Redis/ElastiCache for application-level caching
- CloudFront CDN
- Database connection pooling (RDS Proxy)
- Read replicas for read scaling
- Lambda optimization (provisioned concurrency, memory tuning)
- Response compression

## Monitoring

- CloudWatch dashboards and alarms
- X-Ray distributed tracing
- LangSmith for AI/LLM observability
- Custom metrics and logging

## CI/CD Setup

### GitHub Actions with AWS OIDC

This project uses GitHub Actions with AWS OIDC for secure deployments without storing AWS credentials.

#### Initial Setup

1. Deploy the CI/CD stack to create the OIDC provider and IAM role:
   ```bash
   just cdk:deploy:prod
   ```

2. Get the IAM role ARN from the stack outputs:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name hono-aws-lambda-cicd-production \
     --query 'Stacks[0].Outputs[?OutputKey==`GitHubActionsRoleArn`].OutputValue' \
     --output text
   ```

3. Add the role ARN as GitHub secrets:
   - Go to GitHub repository → Settings → Secrets and variables → Actions
   - Add `AWS_ROLE_ARN_STAGING` with the staging role ARN
   - Add `AWS_ROLE_ARN_PRODUCTION` with the production role ARN

4. Update the CI/CD stack with your GitHub repository:
   - Edit `packages/infrastructure/src/stacks/ci-cd-stack.ts`
   - Update the `GITHUB_REPO` environment variable or hardcode your repo

#### Workflows

- **CI** (`ci.yml`): Runs on push/PR to main/develop/staging
  - Lint, type-check, test, build

- **Deploy Staging** (`deploy-staging.yml`): Deploys to staging environment
  - Triggers on push to develop/staging branches
  - Uses AWS OIDC for authentication

- **Deploy Production** (`deploy-production.yml`): Deploys to production
  - Triggers on push to main branch
  - Requires manual approval (configure in GitHub environment settings)
  - Uses AWS OIDC for authentication

- **Security Scan** (`security-scan.yml`): Security scanning
  - Dependency vulnerability scan
  - Secret scanning with Gitleaks
  - Infrastructure security checks

## Environment Variables

Create a `.env` file in the root directory with the following variables:

### Required

- `NODE_ENV`: Environment (development/staging/production)
- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Secret key for Better Auth (min 32 chars)
- `BETTER_AUTH_URL`: Base URL for Better Auth
- `AWS_REGION`: AWS region (default: us-east-1)

### Optional

- `AWS_ACCOUNT_ID`: AWS account ID (for CDK deployments)
- `REDIS_URL`: Redis connection string (for caching and rate limiting)
- `CORS_ORIGIN`: Allowed CORS origin
- `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds (default: 60000)
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: 100)
- `CSRF_SECRET`: CSRF protection secret (min 32 chars, auto-generated if not provided)
- `SESSION_SECRET`: Session secret (min 32 chars, auto-generated if not provided)
- `LANGCHAIN_API_KEY`: OpenAI API key (for AI features)
- `LANGSMITH_API_KEY`: LangSmith API key (for observability)
- `LANGSMITH_PROJECT`: LangSmith project name (default: dev)
- `LANGSMITH_TRACING`: Enable LangSmith tracing (default: true)
- `LANGSMITH_ENDPOINT`: LangSmith endpoint URL (optional)

### Example `.env` file

**For Docker Development:**
```bash
NODE_ENV=development
# Use service names for Docker networking
DATABASE_URL=postgresql://honoapp:honoapp_password@postgres:5432/honoapp
REDIS_URL=redis://redis:6379
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters-long
BETTER_AUTH_URL=http://localhost:3000
AWS_REGION=us-east-1
CORS_ORIGIN=http://localhost:3000
PORT=3000
```

**For Local Development:**
```bash
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/honoapp
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters-long
BETTER_AUTH_URL=http://localhost:3000
AWS_REGION=us-east-1
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:3000
```

**Note**: When using Docker Compose, database and Redis connection strings should use service names (`postgres`, `redis`) as hostnames instead of `localhost`.

## License

MIT

