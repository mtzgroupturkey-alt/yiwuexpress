# Docker Packaging

Multi-stage Docker builds for Rust backend services with optimized image size.

## Dockerfile - Multi-stage Build

```dockerfile
# ================================
# Stage 1: Build
# ================================
FROM rust:1.83-slim-bookworm AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Copy manifests first (for dependency caching)
COPY Cargo.toml Cargo.lock ./
COPY bin/api-server/Cargo.toml ./bin/api-server/
COPY lib/domain/Cargo.toml ./lib/domain/
COPY lib/services/Cargo.toml ./lib/services/
COPY lib/database/Cargo.toml ./lib/database/

# 2. Create dummy source files for dependency build
RUN mkdir -p bin/api-server/src lib/domain/src lib/services/src lib/database/src && \
    echo "fn main() {}" > bin/api-server/src/main.rs && \
    echo "" > lib/domain/src/lib.rs && \
    echo "" > lib/services/src/lib.rs && \
    echo "" > lib/database/src/lib.rs

# 3. Build dependencies (cached layer)
RUN cargo build --release --bin api-server && \
    rm -rf bin/api-server/src lib/domain/src lib/services/src lib/database/src

# 4. Copy actual source code
COPY bin/api-server/src ./bin/api-server/src
COPY lib/domain/src ./lib/domain/src
COPY lib/services/src ./lib/services/src
COPY lib/database/src ./lib/database/src

# 5. Touch to invalidate cache for rebuild
RUN touch bin/api-server/src/main.rs

# 6. Build release binary
RUN cargo build --release --bin api-server

# ================================
# Stage 2: Runtime
# ================================
FROM debian:bookworm-slim AS runtime

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 -s /bin/bash appuser

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/target/release/api-server /app/api-server

# Set ownership
RUN chown -R appuser:appuser /app

USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Default command
CMD ["./api-server"]
```

## Dockerfile - Alpine Variant (Smaller)

```dockerfile
# ================================
# Stage 1: Build (musl target)
# ================================
FROM rust:1.83-alpine AS builder

# Install build dependencies
RUN apk add --no-cache musl-dev openssl-dev openssl-libs-static pkgconfig

WORKDIR /app

# Copy manifests
COPY Cargo.toml Cargo.lock ./
COPY bin/api-server/Cargo.toml ./bin/api-server/
COPY lib/domain/Cargo.toml ./lib/domain/
COPY lib/services/Cargo.toml ./lib/services/
COPY lib/database/Cargo.toml ./lib/database/

# Create dummy files for dependency caching
RUN mkdir -p bin/api-server/src lib/domain/src lib/services/src lib/database/src && \
    echo "fn main() {}" > bin/api-server/src/main.rs && \
    echo "" > lib/domain/src/lib.rs && \
    echo "" > lib/services/src/lib.rs && \
    echo "" > lib/database/src/lib.rs

# Build dependencies
RUN cargo build --release --bin api-server && \
    rm -rf bin/api-server/src lib/domain/src lib/services/src lib/database/src

# Copy source
COPY bin/api-server/src ./bin/api-server/src
COPY lib/domain/src ./lib/domain/src
COPY lib/services/src ./lib/services/src
COPY lib/database/src ./lib/database/src

RUN touch bin/api-server/src/main.rs

# Build release
RUN cargo build --release --bin api-server

# ================================
# Stage 2: Runtime
# ================================
FROM alpine:3.19 AS runtime

RUN apk add --no-cache ca-certificates

RUN adduser -D -u 1000 appuser

WORKDIR /app

COPY --from=builder /app/target/release/api-server /app/api-server

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 3000

CMD ["./api-server"]
```

## docker-compose.yml

```yaml
version: '3.8'

services:
  api-server:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://postgres:postgres@db:5432/myapp
      - RUST_LOG=info
      - PORT=3000
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - app-network

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

## docker-compose.dev.yml (Development)

```yaml
version: '3.8'

services:
  api-server:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://postgres:postgres@db:5432/myapp_dev
      - RUST_LOG=debug,api_server=trace
    volumes:
      - .:/app
      - cargo_cache:/usr/local/cargo/registry
      - target_cache:/app/target
    depends_on:
      - db
    networks:
      - dev-network

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: myapp_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    networks:
      - dev-network

volumes:
  postgres_dev_data:
  cargo_cache:
  target_cache:

networks:
  dev-network:
    driver: bridge
```

## Dockerfile.dev (Development with hot reload)

```dockerfile
FROM rust:1.83-slim-bookworm

RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install cargo-watch for hot reload
RUN cargo install cargo-watch

WORKDIR /app

# Copy everything
COPY . .

EXPOSE 3000

# Hot reload command
CMD ["cargo", "watch", "-x", "run --bin api-server"]
```

## .dockerignore

```
target/
.git/
.gitignore
*.md
!README.md
Dockerfile*
docker-compose*.yml
.env*
.cargo/
.vscode/
.idea/
*.log
tmp/
```

## GitHub Actions - Build & Push

```yaml
# .github/workflows/docker.yml
name: Docker Build & Push

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

## Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
  labels:
    app: api-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
    spec:
      containers:
        - name: api-server
          image: ghcr.io/myorg/api-server:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: api-secrets
                  key: database-url
            - name: RUST_LOG
              value: "info"
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10

---
apiVersion: v1
kind: Service
metadata:
  name: api-server
spec:
  selector:
    app: api-server
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
```

## Build Commands

```bash
# Build Docker image
docker build -t api-server:latest .

# Build with specific target
docker build -t api-server:latest --target runtime .

# Run locally
docker run -p 3000:3000 \
  -e DATABASE_URL=postgres://user:pass@host:5432/db \
  -e RUST_LOG=info \
  api-server:latest

# Development with docker-compose
docker-compose -f docker-compose.dev.yml up --build

# Production
docker-compose up -d --build

# View logs
docker-compose logs -f api-server

# Stop all
docker-compose down
```

## Image Size Comparison

| Base Image | Approximate Size |
|------------|-----------------|
| debian:bookworm-slim | ~80-100 MB |
| alpine:3.19 | ~20-40 MB |
| scratch (static binary) | ~10-20 MB |

## Tips

1. **Layer caching**: Copy `Cargo.toml` first, build deps, then copy source
2. **Multi-stage**: Use builder + runtime stages
3. **Non-root user**: Always run as non-root in production
4. **Health checks**: Add proper health check endpoints
5. **Static linking**: For Alpine, use `musl` target for static binaries
