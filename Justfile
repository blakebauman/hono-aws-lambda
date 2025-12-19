# Docker Development
docker:up:
    docker compose up

docker:up:d:
    docker compose up -d

docker:down:
    docker compose down

docker:down:v:
    docker compose down -v

docker:logs:
    docker compose logs -f api

docker:logs:all:
    docker compose logs -f

docker:restart:
    docker compose restart api

docker:ps:
    docker compose ps

docker:shell:
    docker compose exec api sh

docker:build:
    docker compose build

docker:clean:
    docker compose down -v
    docker system prune -f

# Setup & Verification
setup:
    @echo "🚀 Setting up development environment..."
    @if [ ! -f .env ]; then \
        echo "📝 Creating .env file from template..."; \
        cp env.example .env; \
        echo "✅ Created .env file. Please update BETTER_AUTH_SECRET:"; \
        echo "   Run: openssl rand -base64 32"; \
    else \
        echo "⚠️  .env file already exists. Skipping..."; \
    fi
    @echo "📦 Installing dependencies..."
    bun install
    @echo "🐳 Starting Docker services..."
    docker compose up -d
    @echo "⏳ Waiting for services to be healthy..."
    @sleep 5
    @echo "📊 Checking service status..."
    docker compose ps
    @echo ""
    @echo "✅ Setup complete! Next steps:"
    @echo "   1. Update BETTER_AUTH_SECRET in .env (if needed)"
    @echo "   2. Run migrations: just db:migrate"
    @echo "   3. Verify setup: just verify"

verify:
    @echo "🔍 Verifying Docker setup..."
    @echo ""
    @echo "📊 Service Status:"
    @docker compose ps
    @echo ""
    @echo "🏥 Health Checks:"
    @echo -n "  PostgreSQL: "
    @docker compose exec -T postgres pg_isready -U honoapp -d honoapp > /dev/null 2>&1 && echo "✅ Healthy" || echo "❌ Unhealthy"
    @echo -n "  Redis: "
    @docker compose exec -T redis redis-cli ping > /dev/null 2>&1 && echo "✅ Healthy" || echo "❌ Unhealthy"
    @echo -n "  API: "
    @curl -sf http://localhost:3000/api/health > /dev/null 2>&1 && echo "✅ Healthy" || echo "❌ Unhealthy"
    @echo ""
    @echo "🔗 Service URLs:"
    @echo "  API: http://localhost:3000"
    @echo "  API Docs: http://localhost:3000/docs"
    @echo "  Health: http://localhost:3000/api/health"

test:db:
    @echo "🔍 Testing database connection..."
    @docker compose exec -T postgres psql -U honoapp -d honoapp -c "SELECT version();" || echo "❌ Database connection failed"

test:redis:
    @echo "🔍 Testing Redis connection..."
    @docker compose exec -T redis redis-cli ping || echo "❌ Redis connection failed"

# Development
dev:
    bun run dev

# Build
build:
    bun run build

# Database
db:migrate:
    bun run --filter=api db:migrate

db:generate:
    bun run --filter=api db:generate

db:reset:
    @echo "⚠️  Resetting database (this will delete all data)..."
    @docker compose exec -T postgres psql -U honoapp -d honoapp -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO honoapp; GRANT ALL ON SCHEMA public TO public;" || echo "❌ Failed to reset database"
    @echo "✅ Database reset. Run 'just db:migrate' to recreate tables."

# Code Quality
lint:
    bun run lint

format:
    bun run format

type-check:
    bun run type-check

test:
    bun run test

test:watch:
    bun run --filter=api test:watch

test:coverage:
    bun run --filter=api test:coverage

# Cache
cache:clear:
    bun run --filter=api cache:clear

cache:warm:
    bun run --filter=api cache:warm

# Performance
perf:test:
    bun run --filter=api perf:test

metrics:view:
    bun run --filter=api metrics:view

# CDK
cdk:synth:
    bun run --filter=infrastructure cdk:synth

cdk:diff:
    bun run --filter=infrastructure cdk:diff

cdk:deploy:staging:
    bun run --filter=infrastructure cdk:deploy:staging

cdk:deploy:prod:
    bun run --filter=infrastructure cdk:deploy:prod

cdk:destroy:staging:
    bun run --filter=infrastructure cdk:destroy:staging

cdk:bootstrap:
    bun run --filter=infrastructure cdk:bootstrap

# Deployment
deploy:staging:
    just cdk:deploy:staging

deploy:prod:
    just cdk:deploy:prod

