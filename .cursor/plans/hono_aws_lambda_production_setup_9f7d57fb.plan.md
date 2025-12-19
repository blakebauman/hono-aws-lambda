---
name: Hono AWS Lambda Production Setup
overview: Set up a production-ready Hono REST API with Bun runtime, AWS Lambda deployment, monorepo structure with Bun workspaces, Better Auth integration, Drizzle ORM with PostgreSQL, LangChain/LangGraph AI integration with LangSmith observability, AWS CDK infrastructure, and development tooling (Biome, Lefthook, Justfile).
todos:
  - id: setup-root
    content: Create root package.json with Bun workspaces, tsconfig.json, biome.json, .lefthook.yml, Justfile, and .env.example
    status: completed
  - id: setup-shared
    content: Create shared package with Drizzle schema, types, and utilities
    status: completed
  - id: setup-api-core
    content: Create API package with Hono app, Lambda handler, and basic structure
    status: completed
  - id: setup-database
    content: Configure Drizzle ORM with PostgreSQL connection and example schema
    status: completed
  - id: setup-auth
    content: Integrate Better Auth with Drizzle adapter and auth routes
    status: completed
  - id: setup-middleware
    content: Add Hono built-in middleware (request-id, secure-headers, CSRF) and helpers
    status: completed
  - id: setup-validation
    content: Configure Zod 4 with @hono/zod-validator and @hono/zod-openapi
    status: completed
  - id: setup-docs
    content: Integrate Scalar API reference with OpenAPI schema generation
    status: completed
  - id: setup-infrastructure
    content: Create AWS CDK v2 infrastructure with Lambda, RDS, S3, and environment stacks
    status: completed
  - id: setup-tooling
    content: Configure Biome, Lefthook, and Justfile commands
    status: completed
  - id: setup-security
    content: Implement hardened security features (rate limiting, input sanitization, security headers, secrets management, logging)
    status: completed
  - id: setup-caching-performance
    content: Implement caching strategies and performance optimizations (HTTP caching, Redis, CDN, connection pooling, Lambda optimization)
    status: completed
  - id: setup-github-actions
    content: Set up GitHub Actions CI/CD workflows (CI, staging deployment, production deployment, security scanning) with AWS OIDC
    status: completed
  - id: setup-langchain
    content: Integrate LangChain and LangGraph (chains, agents, stateful workflows, checkpointing, API endpoints, monitoring) with LangSmith observability
    status: completed
---

# Hono A

WS Lambda Production Setup

## Architecture Overview

```javascript
packages/
├── api/              # Hono API application
├── infrastructure/   # AWS CDK infrastructure code
└── shared/           # Shared types and utilities
```

## Implementation Plan

### 1. Project Structure & Configuration

**Root Level:**

- `package.json` - Root workspace configuration with Bun workspaces
- `bunfig.toml` - Bun configuration
- `tsconfig.json` - TypeScript root config
- `biome.json` - Biome linter/formatter config
- `.lefthook.yml` - Git hooks configuration
- `Justfile` - Task runner commands
- `.env.example` - Environment variable template
- `.github/` - GitHub configuration
- `workflows/` - GitHub Actions workflows
    - `ci.yml` - Continuous Integration (lint, type-check, test)
    - `deploy-staging.yml` - Deploy to staging environment
    - `deploy-production.yml` - Deploy to production environment
    - `security-scan.yml` - Security scanning (dependencies, secrets)
- `dependabot.yml` - Automated dependency updates
- `README.md` - Project documentation

**Packages:**

- `packages/api/` - Main Hono application
- `packages/infrastructure/` - AWS CDK v2 stack
- `packages/shared/` - Shared types, utilities, database schema

### 2. API Package (`packages/api/`)

**Core Setup:**

- Hono app with AWS Lambda adapter (`@hono/node-server` for local dev, `@hono/aws-lambda` for Lambda)
- Better Auth integration with Drizzle adapter
- Drizzle ORM setup with PostgreSQL
- Zod 4 for validation (with `@hono/zod-validator` and `@hono/zod-openapi`)
- Scalar API reference documentation (`@scalar/hono-api-reference`)
- LangChain and LangGraph integration for AI/LLM workflows
- Environment-based configuration (development/staging/production)

**Middleware:**

- `request-id` - Request ID middleware
- `secure-headers` - Security headers (expanded with CSP, HSTS, X-Frame-Options, etc.)
- `csrf` - CSRF protection
- Rate limiting middleware (per IP, per user, per endpoint)
- Request size limits
- Timeout middleware
- Input sanitization middleware
- CORS configuration (strict origin validation)
- Error handling middleware (sanitized error responses)
- Security logging middleware
- HTTP caching middleware (ETags, Cache-Control headers)
- Response compression middleware (gzip/brotli)
- Cache middleware (application-level caching)

**Helpers:**

- Streaming support
- WebSocket support (if needed)
- Response helpers

**Structure:**

```javascript
packages/api/
├── src/
│   ├── index.ts              # Lambda handler entry point
│   ├── app.ts                # Hono app setup
│   ├── routes/               # API routes
│   │   ├── auth.ts           # Auth routes (Better Auth handler)
│   │   ├── api/              # API route handlers
│   │   └── ai/               # LangChain/LangGraph AI routes
│   │       ├── chat.ts       # Chat/completion endpoints
│   │       ├── agents.ts     # Agent workflows
│   │       └── graphs.ts     # LangGraph stateful workflows
│   ├── middleware/           # Custom middleware
│   │   ├── rate-limit.ts     # Rate limiting
│   │   ├── security.ts       # Security headers & validation
│   │   ├── sanitize.ts       # Input sanitization
│   │   ├── audit.ts          # Security logging
│   │   ├── cache.ts          # HTTP caching (ETags, Cache-Control)
│   │   └── compress.ts       # Response compression
│   ├── lib/
│   │   ├── auth.ts           # Better Auth instance
│   │   ├── db.ts             # Drizzle database connection with pooling
│   │   ├── env.ts            # Environment validation
│   │   ├── secrets.ts        # Secrets management (AWS Secrets Manager)
│   │   ├── logger.ts         # Structured logging
│   │   ├── cache.ts          # Cache client (Redis/ElastiCache)
│   │   ├── metrics.ts        # Performance metrics collection
│   │   └── ai/               # LangChain/LangGraph integration
│   │       ├── chains.ts     # LangChain chains setup
│   │       ├── agents.ts     # Agent configurations
│   │       ├── graphs.ts     # LangGraph stateful workflows
│   │       ├── tools.ts      # Custom tools for agents
│   │       ├── memory.ts     # Memory/state management
│   │       ├── checkpoints.ts # LangGraph checkpointing (Redis/PostgreSQL)
│   │       └── langsmith.ts   # LangSmith configuration and callbacks
│   └── types/                # TypeScript types
├── package.json
└── tsconfig.json
```

### 3. Shared Package (`packages/shared/`)

- Database schema definitions (Drizzle)
- Shared TypeScript types
- Common utilities
- Validation schemas (Zod)

### 4. Infrastructure Package (`packages/infrastructure/`)

**AWS CDK v2 Stack (TypeScript) - Advanced Features:**

- **Core Infrastructure:**
- Lambda function with NodejsFunction construct (automatic bundling, esbuild)
- RDS PostgreSQL instance (Aurora Serverless v2 recommended)
    - Read replicas for read scaling
    - Connection pooling (RDS Proxy)
- ElastiCache Redis cluster (for caching and rate limiting)
- S3 bucket(s) with versioning and encryption
- CloudFront distribution (CDN for API responses)
- API Gateway REST API or Lambda Function URL
- VPC configuration (public/private subnets)
- Security groups with least privilege
- IAM roles and policies (least privilege)
- GitHub Actions IAM roles and OIDC provider (for CI/CD)
- **CDK v2 Advanced Features:**
- **CDK Aspects:**
    - Auto-tagging aspect (Environment, Project, CostCenter)
    - Security validation aspect (check for public resources)
    - Cost optimization aspect (right-sizing recommendations)
    - Compliance aspect (ensure encryption, logging enabled)
    - Backup configuration aspect (automated backups)
    - Monitoring aspect (auto-create CloudWatch dashboards)
- **CDK Annotations:**
    - Warnings for non-production resources
    - Errors for security misconfigurations
    - Info messages for deployment steps
- **CDK Bundling:**
    - Custom Lambda bundling with esbuild
    - Asset bundling for Lambda layers
    - Docker-based bundling for custom runtimes
    - Local bundling for faster development
- **CDK Custom Resources:**
    - Custom resource for database migrations
    - Custom resource for cache warming
    - Custom resource for initial data seeding
- **GitHub Actions CI/CD:**
    - GitHub Actions workflows for CI/CD
    - Multi-stage deployments (dev → staging → prod)
    - Automated testing in pipeline (lint, type-check, unit tests)
    - Manual approval gates for production deployments
    - Environment protection rules in GitHub
    - OIDC authentication for AWS (no long-lived credentials)
    - Matrix builds for multiple environments
    - Caching for faster builds (Bun, CDK, dependencies)
    - Deployment status reporting
    - Rollback capabilities
- **CDK Stack Dependencies:**
    - Stack ordering (VPC → Database → API)
    - Cross-stack references via outputs
    - Stack parameter passing
- **CDK Removal Policies:**
    - RETAIN for production databases
    - SNAPSHOT for staging databases
    - DESTROY for development resources
- **CDK Context:**
    - Environment-specific values
    - Feature flags
    - Configuration lookup
- **CDK Asset Bundling:**
    - Lambda layer bundling
    - Custom asset bundling for dependencies
    - Docker-based bundling
- **CDK Constructs:**
    - Higher-level constructs (patterns library)
    - Reusable constructs for common patterns
    - Construct composition
- **CDK Validation:**
    - Pre-synthesis validation
    - Post-synthesis validation
    - Custom validation rules
- **CDK Tags:**
    - Automatic resource tagging
    - Cost allocation tags
    - Environment tags
    - Project tags
- **CDK Outputs & Exports:**
    - Cross-stack references
    - Stack outputs for other services
    - CloudFormation exports
- **CDK Parameters:**
    - Stack parameters for configuration
    - Parameter validation
    - Default values
- **CDK Aspects for Security:**
    - Encryption validation
    - Public access validation
    - IAM policy validation
    - Security group validation
- **CDK Aspects for Monitoring:**
    - Auto-create CloudWatch dashboards
    - Auto-create CloudWatch alarms
    - Auto-enable X-Ray tracing
    - Auto-configure log retention
- **CDK Aspects for Cost Optimization:**
    - Right-sizing recommendations
    - Reserved instance suggestions
    - Unused resource detection
- **Performance & Monitoring:**
- Lambda optimization (provisioned concurrency, memory tuning)
- X-Ray tracing for performance monitoring
- CloudWatch dashboards and alarms (auto-created via aspects)
- CloudWatch Logs groups with retention policies
- CloudWatch Insights queries
- **Configuration:**
- Environment-specific stacks (staging/production)
- CDK context for environment variables
- Stack parameters and outputs
- CDK bootstrap for deployment
- CDK feature flags

### 4.5. GitHub Actions CI/CD Pipeline

**Workflow Features:**

- **CI Workflow (`ci.yml`):**
- Run on every push and pull request
- Lint code with Biome
- Type check with TypeScript
- Run unit tests
- Build all packages
- Cache dependencies (Bun, npm packages)
- Matrix builds for multiple Node.js/Bun versions
- Upload test coverage
- Comment PR with test results
- **Staging Deployment (`deploy-staging.yml`):**
- Trigger on merge to `develop` or `staging` branch
- Manual workflow dispatch option
- AWS OIDC authentication (no long-lived credentials)
- Synthesize CDK stacks
- Run CDK diff to show changes
- Deploy to staging environment
- Run smoke tests after deployment
- Notify on success/failure (Slack, email, etc.)
- **Production Deployment (`deploy-production.yml`):**
- Trigger on merge to `main` or `master` branch
- Manual workflow dispatch with approval required
- GitHub environment protection rules
- AWS OIDC authentication
- Pre-deployment validation
- Synthesize and diff CDK stacks
- Deploy to production environment
- Run integration tests
- Rollback capability on failure
- Deployment notifications
- **Security Scanning (`security-scan.yml`):**
- Dependency vulnerability scanning
- Secret scanning
- Infrastructure security checks
- CDK security validation
- SAST (Static Application Security Testing)
- License compliance checking
- **GitHub Features:**
- GitHub Environments (staging, production)
- Environment protection rules
- Required reviewers for production
- Deployment branches restriction
- Secrets management (AWS credentials via OIDC)
- Dependabot for automated dependency updates
- Branch protection rules
- Status checks for PRs
- **AWS Integration:**
- OIDC provider setup for GitHub Actions (no long-lived credentials)
- IAM roles for GitHub Actions with trust policy
- Least privilege IAM policies per environment
- Separate roles per environment (staging, production)
- CloudFormation stack updates via CDK
- Deployment status reporting
- AWS credentials via `configure-aws-credentials` action with OIDC

**Structure:**

```javascript
packages/infrastructure/
├── src/
│   ├── app.ts                # CDK app entry
│   ├── stacks/
│   │   ├── api-stack.ts      # Lambda + API Gateway
│   │   ├── database-stack.ts # RDS PostgreSQL
│   │   ├── cache-stack.ts    # ElastiCache Redis
│   │   ├── storage-stack.ts  # S3 buckets
│   │   ├── cdn-stack.ts      # CloudFront
│   │   ├── security-stack.ts # WAF, Security Groups
│   │   └── monitoring-stack.ts # CloudWatch, X-Ray
│   ├── lib/
│   │   ├── config.ts         # Environment config
│   │   ├── aspects/          # CDK Aspects
│   │   │   ├── tagging.ts    # Auto-tagging aspect
│   │   │   ├── security.ts   # Security validation aspect
│   │   │   ├── cost.ts       # Cost optimization aspect
│   │   │   ├── compliance.ts # Compliance validation aspect
│   │   │   ├── backup.ts     # Backup configuration aspect
│   │   │   └── monitoring.ts # Monitoring setup aspect
│   │   ├── constructs/       # Reusable constructs
│   │   │   ├── secure-lambda.ts # Secure Lambda construct
│   │   │   ├── secure-rds.ts    # Secure RDS construct
│   │   │   ├── secure-s3.ts     # Secure S3 construct
│   │   │   └── secure-vpc.ts    # Secure VPC construct
│   │   └── custom-resources/  # Custom CDK resources
│   │       ├── migration.ts   # Database migration resource
│   │       ├── cache-warm.ts   # Cache warming resource
│   │       └── seed-data.ts   # Data seeding resource
│   ├── test/                 # CDK unit tests
│   │   └── stacks.test.ts
│   └── bin/                  # CDK app entry points
│       ├── deploy-dev.ts
│       ├── deploy-staging.ts
│       └── deploy-prod.ts
├── cdk.json                  # CDK configuration
├── cdk.context.json          # CDK context (gitignored)
├── jest.config.js            # CDK testing config
├── package.json
└── tsconfig.json
```

### 5. Development Tooling

**Biome:**

- Linting rules
- Formatting configuration
- Import sorting

**Lefthook:**

- Pre-commit hooks (lint, format, type-check)
- Pre-push hooks (tests if applicable)

**Justfile:**

- `just dev` - Start local development server
- `just build` - Build all packages
- `just deploy:staging` - Deploy to staging
- `just deploy:prod` - Deploy to production
- `just db:migrate` - Run database migrations
- `just db:generate` - Generate Drizzle migrations
- `just lint` - Run linter
- `just format` - Format code
- `just type-check` - Type check all packages
- `just cache:clear` - Clear application cache
- `just cache:warm` - Warm cache with common queries
- `just perf:test` - Run performance tests
- `just metrics:view` - View performance metrics
- `just cdk:synth` - Synthesize CDK stacks
- `just cdk:diff` - Show CDK diff
- `just cdk:deploy:staging` - Deploy CDK stacks to staging
- `just cdk:deploy:prod` - Deploy CDK stacks to production
- `just cdk:destroy:staging` - Destroy staging stacks
- `just cdk:bootstrap` - Bootstrap CDK environment

### 6. Database Setup

- Drizzle ORM with PostgreSQL
- Migration system
- Example schema (users table for Better Auth + example)
- Connection pooling for Lambda (RDS Proxy or PgBouncer)
- Database query optimization (indexes, query analysis)
- Read replicas for read-heavy workloads
- Database connection caching

### 7. Authentication Setup

- Better Auth with Drizzle adapter
- Email/password authentication
- Session management
- Protected route middleware
- Auth routes mounted at `/api/auth/*`

### 8. Environment Configuration

- Development (local Bun server)
- Staging (AWS Lambda staging)
- Production (AWS Lambda production)
- Environment variable validation with Zod
- LLM API keys (OpenAI, Anthropic, etc.) via AWS Secrets Manager
- LangSmith API key and configuration via AWS Secrets Manager
- LangSmith project names per environment (dev/staging/prod)

### 8.5. LangChain & LangGraph Integration

**Core Features:**

- **LangChain Integration:**
  - LangChain chains for LLM workflows
  - Agent configurations with custom tools
  - Memory management (conversation history)
  - Streaming support for real-time responses
  - Multiple LLM provider support (OpenAI, Anthropic, etc.)
  - Tool calling and function execution
  - Prompt templates and management
  - Document loaders and text splitters
  - Vector store integration (optional, for RAG)

- **LangGraph Integration:**
  - Stateful agent workflows
  - Graph-based agent orchestration
  - Checkpointing for state persistence (Redis or PostgreSQL)
  - Human-in-the-loop support
  - Conditional routing and decision nodes
  - Parallel execution of nodes
  - Error handling and retry logic
  - Workflow visualization and debugging

- **State Management:**
  - Redis checkpointing for LangGraph state
  - PostgreSQL checkpointing (alternative)
  - Conversation memory storage
  - Session management per user
  - State cleanup and TTL policies

- **API Endpoints:**
  - `/api/ai/chat` - Chat completion endpoint
  - `/api/ai/chat/stream` - Streaming chat endpoint
  - `/api/ai/agents` - Agent workflow endpoints
  - `/api/ai/graphs` - LangGraph stateful workflow endpoints
  - `/api/ai/graphs/:graphId/state` - Get workflow state
  - `/api/ai/graphs/:graphId/stream` - Stream workflow execution

- **Security & Performance:**
  - Rate limiting for AI endpoints (separate limits)
  - Token usage tracking and limits
  - Cost monitoring per request
  - Input validation and sanitization
  - Output filtering and content moderation
  - API key rotation support
  - Request/response caching for common queries

- **Monitoring:**
  - Token usage metrics
  - Latency tracking for LLM calls
  - Error rate monitoring
  - Cost tracking per user/environment
  - Conversation analytics
  - LangSmith integration for observability

- **Integration Points:**
  - Database tools (query database via agents)
  - API tools (call external APIs)
  - Custom business logic tools
  - Authentication context in agents
  - User-specific agent configurations

- **LangSmith Observability:**
  - Automatic tracing of all LangChain/LangGraph runs
  - Run tracking and debugging with full trace visualization
  - Performance monitoring and analytics dashboard
  - Cost tracking per run, project, and user
  - Error tracking and debugging with stack traces
  - Prompt management and versioning
  - Dataset management for evaluation
  - Custom evaluators for run assessment (Jaccard, semantic similarity, etc.)
  - Feedback collection and analysis
  - Project organization (staging/production)
  - Environment tagging (dev/staging/prod)
  - User/session tracking with authentication context
  - Custom metadata and tags per run
  - Run comparison and analysis
  - Latency and token usage analytics
  - Integration with LangChain callbacks (tracing callbacks)
  - Batch evaluation support
  - Run filtering and search
  - Export runs and datasets
  - API access for programmatic monitoring
  - Webhook support for run events
  - Integration with existing monitoring (CloudWatch metrics)

### 9. API Documentation

- Scalar API reference integration
- OpenAPI schema generation via `@hono/zod-openapi`
- Auto-generated from Zod schemas

### 10. Security Hardening

**Application-Level Security:**

- **Rate Limiting:**
- Per-IP rate limiting (sliding window)
- Per-user rate limiting (authenticated requests)
- Per-endpoint rate limiting (different limits for different routes)
- Distributed rate limiting using Redis/DynamoDB for Lambda
- Rate limit headers in responses
- **Input Validation & Sanitization:**
- All inputs validated with Zod schemas
- SQL injection prevention (Drizzle ORM parameterized queries)
- XSS prevention (input sanitization, output encoding)
- Path traversal prevention
- Command injection prevention
- Request size limits (body, headers, query params)
- Content-Type validation
- **Security Headers:**
- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Frame-Options (DENY)
- X-Content-Type-Options (nosniff)
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy
- Cross-Origin-Embedder-Policy
- Cross-Origin-Opener-Policy
- Cross-Origin-Resource-Policy
- **Authentication & Authorization:**
- Better Auth with secure session management
- JWT token validation
- Role-based access control (RBAC) middleware
- Permission-based access control
- Session timeout and rotation
- Password strength requirements
- Account lockout after failed attempts
- Multi-factor authentication (MFA) support
- **Error Handling:**
- Sanitized error messages (no stack traces in production)
- Consistent error response format
- Security event logging (failed auth, rate limit hits, etc.)
- No information leakage in error responses
- **Request Security:**
- Request timeout limits
- Maximum request size limits
- Header size limits
- Query parameter validation
- Path parameter validation
- Request ID tracking for audit trails
- **Secrets Management:**
- AWS Secrets Manager integration
- Environment variable encryption
- No secrets in code or logs
- Secret rotation support
- Separate secrets for staging/production
- **Logging & Monitoring:**
- Structured logging (JSON format)
- Security event logging (auth failures, rate limits, suspicious activity)
- Request/response logging (sanitized, no sensitive data)
- CloudWatch integration
- Alerting on security events

**Infrastructure Security:**

- **AWS Security:**
- VPC configuration (private subnets for Lambda and RDS)
- Security groups (least privilege access)
- IAM roles with least privilege policies
- Encryption at rest (RDS, S3, Lambda environment variables)
- Encryption in transit (TLS 1.2+)
- AWS WAF rules (if using API Gateway)
- CloudTrail logging
- GuardDuty integration
- Secrets Manager for database credentials
- Parameter Store for configuration
- No hardcoded credentials
- **Database Security:**
- RDS in private subnet
- SSL/TLS connections required
- Database user with minimal privileges
- Connection encryption
- Automated backups with encryption
- Database audit logging
- **Network Security:**
- Private subnets for compute resources
- NAT Gateway for outbound internet access
- No public IPs for Lambda or RDS
- VPC endpoints for AWS services
- Network ACLs configured
- **S3 Security:**
- Bucket encryption (SSE-S3 or SSE-KMS)
- Bucket policies (least privilege)
- Versioning enabled
- MFA delete (optional)
- Access logging enabled
- Block public access

**Development Security:**

- **Dependency Security:**
- Regular dependency updates
- Vulnerability scanning (npm audit, Snyk, etc.)
- Dependency pinning
- License compliance checking
- **Code Security:**
- No secrets in git
- .gitignore for sensitive files
- Pre-commit hooks for security checks
- Code review requirements
- Static analysis tools
- **CI/CD Security:**
- Secrets in CI/CD environment variables
- Least privilege IAM for deployment
- Deployment approval process for production
- Security scanning in pipeline

### 11. Caching & Performance Optimization

**HTTP Caching:**

- **Cache-Control Headers:**
- Public/private cache directives
- Max-age configuration per route
- Stale-while-revalidate support
- Cache invalidation strategies
- Vary headers for content negotiation
- **ETag Support:**
- Entity tags for conditional requests
- Weak vs strong ETags
- 304 Not Modified responses
- ETag generation for dynamic content
- **CDN Integration:**
- CloudFront distribution configuration
- Cache behaviors per path pattern
- Origin request policies
- Response headers policies
- Cache key customization
- TTL configuration

**Application-Level Caching:**

- **Redis/ElastiCache:**
- Distributed caching layer
- Cache-aside pattern implementation
- Write-through caching for critical data
- Cache warming strategies
- Cache invalidation on data updates
- TTL management
- Namespace/key prefixing
- **In-Memory Caching:**
- Lambda container reuse for in-memory cache
- LRU cache for frequently accessed data
- Cache size limits
- Memory-efficient caching strategies
- **Database Query Caching:**
- Query result caching
- Parameterized query caching
- Cache invalidation on schema changes
- Cache hit/miss metrics

**Lambda Performance:**

- **Cold Start Optimization:**
- Provisioned concurrency for critical functions
- Lambda layers for shared dependencies
- Minimal bundle size
- Tree-shaking and code splitting
- ESM modules for faster parsing
- **Memory & Timeout Configuration:**
- Memory optimization (right-sizing)
- Timeout configuration per route
- CPU allocation based on memory
- Performance testing and tuning
- **Connection Management:**
- Database connection pooling (RDS Proxy)
- HTTP connection reuse
- Connection timeout configuration
- Connection health checks
- Connection pool monitoring

**Database Performance:**

- **Query Optimization:**
- Database indexes on frequently queried columns
- Composite indexes for multi-column queries
- Query execution plan analysis
- Slow query logging
- Query result pagination
- Prepared statements (Drizzle ORM)
- **Read Scaling:**
- RDS read replicas
- Read/write splitting
- Connection routing to replicas
- Replica lag monitoring
- Automatic failover
- **Connection Pooling:**
- RDS Proxy for connection pooling
- Pool size configuration
- Connection timeout settings
- Idle connection management
- Pool monitoring and metrics

**Response Optimization:**

- **Compression:**
- Gzip compression for text responses
- Brotli compression (when supported)
- Compression level configuration
- Content-Type based compression
- Compression threshold (min size)
- **Response Streaming:**
- Streaming for large responses
- Chunked transfer encoding
- Server-Sent Events (SSE) support
- Progressive response delivery
- **Pagination:**
- Cursor-based pagination
- Offset-based pagination (with limits)
- Page size limits
- Pagination metadata in responses

**Monitoring & Observability:**

- **Performance Metrics:**
- Response time tracking
- P50, P95, P99 latency metrics
- Throughput metrics (requests/second)
- Cache hit/miss ratios
- Database query performance
- Lambda execution metrics
- **AWS X-Ray Integration:**
- Distributed tracing
- Service map generation
- Performance bottleneck identification
- Trace sampling configuration
- Custom annotations and metadata
- **CloudWatch Metrics:**
- Custom metrics for business logic
- Performance dashboards
- Alarms for performance degradation
- Log insights for performance analysis
- **Application Performance Monitoring (APM):**
- Request tracing
- Database query tracing
- External API call tracing
- Performance profiling
- Memory usage monitoring

**Optimization Strategies:**

- **Lazy Loading:**
- Deferred data loading
- On-demand resource fetching
- Progressive enhancement
- **Data Fetching:**
- Batch requests where possible
- Parallel data fetching
- Request deduplication
- Data prefetching for predictable patterns
- **Code Optimization:**
- Tree-shaking unused code
- Code splitting by route
- Lazy route loading
- Minimize dependencies
- Use native implementations where possible
- **Asset Optimization:**
- Minification
- Compression
- CDN delivery
- HTTP/2 and HTTP/3 support

## Key Dependencies

**API Package:**

- `hono`
- `@hono/aws-lambda`
- `@hono/node-server` (dev)
- `better-auth`
- `better-auth/adapters/drizzle`
- `drizzle-orm`
- `drizzle-kit`
- `@postgres-js/postgres` or `pg`
- `zod` (v4 when available, or latest)
- `@hono/zod-validator`
- `@hono/zod-openapi`
- `@scalar/hono-api-reference`
- `@aws-sdk/client-secrets-manager` - Secrets management
- `@aws-sdk/client-cloudwatch-logs` - Logging
- `@aws-sdk/client-dynamodb` - Rate limiting storage (optional)
- `ioredis` or `@redis/client` - Rate limiting and caching
- `dompurify` or `sanitize-html` - Input sanitization
- `helmet` equivalent middleware or custom security headers
- `compression` or `@hono/compress` - Response compression
- `@aws-sdk/client-elasticache` - ElastiCache client (if needed)
- `@aws-sdk/client-xray` - X-Ray tracing
- `@aws-sdk/client-cloudwatch` - CloudWatch metrics
- `lru-cache` - In-memory LRU cache
- `langchain` - LangChain core library
- `@langchain/core` - LangChain core utilities
- `@langchain/langgraph` - LangGraph for stateful workflows
- `langsmith` - LangSmith observability and monitoring
- `@langchain/openai` - OpenAI integration (optional)
- `@langchain/anthropic` - Anthropic integration (optional)
- `@langchain/community` - Community integrations (optional)

**Infrastructure:**

- `aws-cdk-lib` - CDK v2 core library (contains CloudFront, ElastiCache, RDS, X-Ray, Lambda, etc.)
- `constructs` - Base constructs library
- `aws-cdk` - CDK CLI tool (dev dependency, or use `bunx aws-cdk`)
- `aws-lambda-nodejs` - Node.js Lambda bundling (optional, can use aws-cdk-lib/aws-lambda-nodejs)

**Shared:**

- `drizzle-orm`
- `zod`

## Files to Create

1. Root configuration files (package.json, tsconfig.json, biome.json, etc.)
2. `packages/api/src/index.ts` - Lambda handler
3. `packages/api/src/app.ts` - Hono app
4. `packages/api/src/lib/auth.ts` - Better Auth setup
5. `packages/api/src/lib/db.ts` - Database connection
6. `packages/api/src/lib/secrets.ts` - AWS Secrets Manager integration
7. `packages/api/src/lib/logger.ts` - Structured logging
8. `packages/api/src/middleware/rate-limit.ts` - Rate limiting middleware
9. `packages/api/src/middleware/security.ts` - Security headers & validation
10. `packages/api/src/middleware/sanitize.ts` - Input sanitization
11. `packages/api/src/middleware/audit.ts` - Security event logging
12. `packages/api/src/middleware/cache.ts` - HTTP caching middleware
13. `packages/api/src/middleware/compress.ts` - Response compression
14. `packages/api/src/lib/cache.ts` - Cache client (Redis)
15. `packages/api/src/lib/metrics.ts` - Performance metrics
16. `packages/api/src/lib/ai/chains.ts` - LangChain chains setup
17. `packages/api/src/lib/ai/agents.ts` - Agent configurations
18. `packages/api/src/lib/ai/graphs.ts` - LangGraph stateful workflows
19. `packages/api/src/lib/ai/tools.ts` - Custom tools for agents
20. `packages/api/src/lib/ai/memory.ts` - Memory/state management
21. `packages/api/src/lib/ai/checkpoints.ts` - LangGraph checkpointing
22. `packages/api/src/lib/ai/langsmith.ts` - LangSmith configuration and callbacks
23. `packages/api/src/routes/auth.ts` - Auth routes
24. `packages/api/src/routes/ai/chat.ts` - Chat/completion endpoints
25. `packages/api/src/routes/ai/agents.ts` - Agent workflow endpoints
26. `packages/api/src/routes/ai/graphs.ts` - LangGraph stateful workflow endpoints
27. `packages/shared/src/db/schema.ts` - Database schema
28. `packages/infrastructure/src/app.ts` - CDK app
29. `packages/infrastructure/src/stacks/api-stack.ts` - Lambda + API Gateway with security
30. `packages/infrastructure/src/stacks/database-stack.ts` - RDS with security and read replicas
31. `packages/infrastructure/src/stacks/storage-stack.ts` - S3 with security
32. `packages/infrastructure/src/stacks/cache-stack.ts` - ElastiCache Redis cluster
33. `packages/infrastructure/src/stacks/cdn-stack.ts` - CloudFront distribution
34. `packages/infrastructure/src/stacks/security-stack.ts` - Security resources (WAF, etc.)
35. `packages/infrastructure/src/stacks/monitoring-stack.ts` - CloudWatch, X-Ray, dashboards
36. `packages/infrastructure/src/stacks/ci-cd-stack.ts` - GitHub Actions IAM roles and OIDC provider
37. `packages/infrastructure/src/lib/aspects/tagging.ts` - Auto-tagging aspect
38. `packages/infrastructure/src/lib/aspects/security.ts` - Security validation aspect
39. `packages/infrastructure/src/lib/aspects/cost.ts` - Cost optimization aspect
40. `packages/infrastructure/src/lib/aspects/compliance.ts` - Compliance validation aspect
41. `packages/infrastructure/src/lib/aspects/backup.ts` - Backup configuration aspect
42. `packages/infrastructure/src/lib/aspects/monitoring.ts` - Monitoring setup aspect
43. `packages/infrastructure/src/lib/constructs/secure-lambda.ts` - Secure Lambda construct
44. `packages/infrastructure/src/lib/constructs/secure-rds.ts` - Secure RDS construct
45. `packages/infrastructure/src/lib/constructs/secure-s3.ts` - Secure S3 construct
46. `packages/infrastructure/src/lib/constructs/secure-vpc.ts` - Secure VPC construct
47. `packages/infrastructure/src/lib/custom-resources/migration.ts` - Database migration resource
48. `packages/infrastructure/src/lib/custom-resources/cache-warm.ts` - Cache warming resource
49. `packages/infrastructure/src/lib/custom-resources/seed-data.ts` - Data seeding resource
50. `.github/workflows/ci.yml` - CI workflow (lint, type-check, test)
51. `.github/workflows/deploy-staging.yml` - Staging deployment workflow
52. `.github/workflows/deploy-production.yml` - Production deployment workflow
53. `.github/workflows/security-scan.yml` - Security scanning workflow
54. `.github/dependabot.yml` - Dependabot configuration
55. `Justfile` - Task commands
56. `.lefthook.yml` - Git hooks
57. `.gitignore` - Exclude sensitive files