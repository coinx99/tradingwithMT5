# Docker Setup for Shared Types

## Vấn đề

Khi chạy services trong Docker container, cần đảm bảo shared-types package được build và available trong container.

## Giải pháp

### 1. Dockerfile Configuration

Trong `services/[service-name]/Dockerfile.dev`, thêm các bước sau:

```dockerfile
# Copy shared-types package
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-types/tsconfig.json ./packages/shared-types/
COPY packages/shared-types/src ./packages/shared-types/src

# Copy service package.json
COPY services/[service-name]/package.json ./services/[service-name]/

# Install all dependencies (including dev)
RUN pnpm install --frozen-lockfile

# Build shared-types package
RUN cd packages/shared-types && pnpm build

# Copy service source code
COPY services/[service-name] ./services/[service-name]
```

### 2. Docker Compose Configuration

Trong `infrastructure/docker/docker-compose.dev.yml`:

```yaml
services:
  [service-name]:
    build:
      context: ../../  # Point to project root
      dockerfile: services/[service-name]/Dockerfile.dev
    volumes:
      # Mount source code for hot reload
      - ../../services/[service-name]/src:/app/services/[service-name]/src:ro
      # Mount shared-types package for hot reload
      - ../../packages/shared-types:/app/packages/shared-types:ro
      # Preserve node_modules
      - /app/services/[service-name]/node_modules
      - /app/packages/shared-types/node_modules
```

**Important notes:**
- `context: ../../` - Build context phải là project root để access cả `packages/` và `services/`
- Volume paths phải relative to `docker-compose.dev.yml` location
- Mount cả `shared-types` để support hot reload

### 3. Build & Run

```bash
# Build image
docker compose -f infrastructure/docker/docker-compose.dev.yml build [service-name]

# Start service
docker compose -f infrastructure/docker/docker-compose.dev.yml up [service-name] -d

# Check logs
docker compose -f infrastructure/docker/docker-compose.dev.yml logs [service-name] --tail=50

# Restart service
docker compose -f infrastructure/docker/docker-compose.dev.yml restart [service-name]
```

## Troubleshooting

### Error: Cannot find module '@marketing-agency/shared-types'

**Cause:** Shared-types package not built or not mounted in container.

**Solution:**
1. Verify Dockerfile includes shared-types copy and build steps
2. Verify docker-compose.yml mounts shared-types volume
3. Rebuild image: `docker compose build [service-name]`
4. Restart container: `docker compose up [service-name] -d`

### Error: Build context path not found

**Cause:** Incorrect `context` path in docker-compose.yml.

**Solution:**
- Ensure `context: ../../` points to project root
- Paths are relative to docker-compose.yml location

### Hot Reload Not Working

**Cause:** Volumes not properly mounted.

**Solution:**
- Verify volume paths in docker-compose.yml
- Ensure both service source and shared-types are mounted
- Restart container after changing docker-compose.yml

## Production Dockerfile

For production, use multi-stage build:

```dockerfile
# Stage 1: Build shared-types
FROM node:20-alpine AS shared-builder
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared-types ./packages/shared-types
RUN npm install -g pnpm@8.12.0
RUN pnpm install --frozen-lockfile
RUN cd packages/shared-types && pnpm build

# Stage 2: Build service
FROM node:20-alpine AS builder
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY --from=shared-builder /app/packages/shared-types ./packages/shared-types
COPY services/[service-name] ./services/[service-name]
RUN npm install -g pnpm@8.12.0
RUN pnpm install --frozen-lockfile --prod
RUN cd services/[service-name] && pnpm build

# Stage 3: Production
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/services/[service-name]/dist ./services/[service-name]/dist
COPY --from=builder /app/node_modules ./node_modules
WORKDIR /app/services/[service-name]
CMD ["node", "dist/main"]
```

## Verification

After setup, verify:

```bash
# 1. Check container is running
docker compose ps

# 2. Check logs for errors
docker compose logs [service-name] --tail=50

# 3. Expected output
# [12:18:37 PM] Found 0 errors. Watching for file changes.

# 4. Test hot reload
# Edit shared-types/src/user/enums.ts
# Container should auto-recompile
```

## Example: User Service

See `services/user/Dockerfile.dev` and `infrastructure/docker/docker-compose.dev.yml` for complete working example.

## Summary

✅ **Dockerfile**: Copy and build shared-types before service
✅ **Docker Compose**: Mount shared-types for hot reload
✅ **Build Context**: Point to project root
✅ **Volume Paths**: Relative to docker-compose.yml location
