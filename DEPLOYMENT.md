# Orbital Command: Production Deployment Guide

This guide details the procedures for compiling, containerizing, monitoring, and deploying the **Orbital Command** platform to production environments.

---

## 1. Deployment Architectures

To support the high-frequency 1-second telemetry ticks over WebSockets, the platform supports two production hosting designs:

### Option A: Monolithic Container (Recommended)
Both the Next.js app and the custom Express/Socket.io websocket server run in a single container.
* **Target Platforms**: AWS ECS/Fargate, Fly.io, Render, Google Cloud Run, DigitalOcean App Platform, or VPS.
* **Why**: Long-lived WebSockets connections work out-of-the-box on the same port (`3000`), and Next.js page serving is handled natively.

### Option B: Split Frontend / Backend
Next.js pages are served from a serverless host, and WebSockets/Telemetry is delegated to a dedicated container node.
* **Frontend**: Deploy Next.js to **Vercel** or Netlify.
* **Backend**: Deploy the custom Express/Socket.io server wrapper (`server.ts`) inside a container on Fly.io, AWS, or VPS.
* **Configuration**: Configure the Vercel environment variable `NEXT_PUBLIC_SOCKET_URL` pointing to the backend service URL (e.g. `wss://telemetry-backend.orbital.command`).

---

## 2. Docker Orchestration

The project provides a multi-stage `Dockerfile` and a `docker-compose.yml` orchestrating PostgreSQL, Redis, and the core application.

### Local Container Build
```bash
# Build the production Docker image
docker build -t orbital-command:latest .

# Run the monolithic stack (DB + Cache + App)
docker compose up -d
```

### Production Docker Compose configuration (`docker-compose.prod.yml`)
Ensure environment values, persistent volumes, and secure passwords are configured:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: admin_operator
      POSTGRES_PASSWORD: secure_ops_password_987
      POSTGRES_DB: orbital_command
    volumes:
      - pg_prod_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass secure_cache_pass_123 --maxmemory 512mb --maxmemory-policy allkeys-lru --save 60 1
    volumes:
      - redis_prod_data:/data
    ports:
      - "6379:6379"

  app:
    image: orbital-command:latest
    restart: always
    depends_on:
      - postgres
      - redis
    ports:
      - "80:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://admin_operator:secure_ops_password_987@postgres:5432/orbital_command?schema=public
      - REDIS_URL=redis://:secure_cache_pass_123@redis:6379
      - JWT_SECRET=change-this-to-a-very-long-production-key-456
      - OPENAI_API_KEY=sk-proj-prodKeyPlaceholder
      - PORT=3000

volumes:
  pg_prod_data:
  redis_prod_data:
```

---

## 3. Database Sync & Migrations

When deploy pipelines execute or container initializations boot, run database synchronization checks:
```bash
# Execute schema migration in staging / prod
npx prisma migrate deploy

# Seed initial operator roles (Admin, Operator, Viewer)
npx prisma db seed
```

---

## 4. Redis Performance Specifications

Configure the Redis container to act as a fast cache:
1. **Eviction Policy**: Set `--maxmemory-policy allkeys-lru`. This evicts the oldest keys when memory constraints are hit, keeping active satellite updates snappy.
2. **Persistence**: The command `--save 60 1` dumps state snapshots to disk if at least 1 write occurred in 60 seconds, which preserves active user audit records.

---

## 5. Monitoring & Health Statuses

An endpoint is provided at `/api/health` to expose system vitals for load balancers (Kubernetes, AWS Target Groups, or Uptime monitors).

### Health Response Structure
Returns `200 OK` if database and Redis links are live. Returns `503 Service Unavailable` if critical systems fail:
```json
{
  "status": "healthy",
  "timestamp": "2026-06-24T23:24:30.000Z",
  "uptimeSeconds": 1420.5,
  "services": {
    "database": { "status": "online", "latencyMs": 12 },
    "redis": { "status": "online", "latencyMs": 2 }
  }
}
```

### Prometheus Target Configuration
Add the health endpoint as a target check in your `prometheus.yml`:
```yaml
scrape_configs:
  - job_name: 'orbital-command'
    metrics_path: '/api/health'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:3000']
```

---

## 6. Structured Logging

The platform logs events in standardized structured JSON format to stdout:
```json
{"timestamp":"2026-06-24T23:24:36.120Z","level":"INFO","message":"Console authentication success. Operator role: ADMIN (database)","context":"AuthAPI"}
```

This output can be captured by standard container collectors (Datadog Agent, fluent-bit, AWS CloudWatch Logs, or Grafana Loki) to construct security metrics dashboards.
