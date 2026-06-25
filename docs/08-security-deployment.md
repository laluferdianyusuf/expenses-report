# FMS Enterprise — Security & Deployment Architecture

---

## 1. Security Architecture

### 1.1 Defense in Depth

```mermaid
flowchart TB
    subgraph L1["Layer 1 — Network"]
        TLS["TLS 1.3 HTTPS"]
        CORS["CORS Whitelist"]
        HELMET["Helmet Security Headers"]
        RATE["Rate Limiting"]
    end

    subgraph L2["Layer 2 — Authentication"]
        JWT["JWT Access Token (15m)"]
        REFRESH["Refresh Token Rotation (7d)"]
        ARGON["Argon2id Password Hash"]
        BIO["Biometric Gate (Mobile)"]
    end

    subgraph L3["Layer 3 — Authorization"]
        RBAC["RBAC Permission Guard"]
        TENANT["Tenant Isolation Guard"]
        BRANCH["Branch Scope Filter"]
    end

    subgraph L4["Layer 4 — Data"]
        VALID["Input Validation"]
        PRISMA["Prisma ORM (SQL Injection)"]
        AUDIT["Audit Trail"]
        ENCRYPT["SecureStore (Tokens)"]
    end

    subgraph L5["Layer 5 — File"]
        MIME["MIME Type Validation"]
        SIZE["File Size Limit (10MB)"]
        PRESIGN["Presigned URL (Time-limited)"]
        R2ACL["R2 Bucket Private"]
    end

    L1 --> L2 --> L3 --> L4 --> L5
```

### 1.2 JWT Configuration

```typescript
// config/jwt.config.ts
{
  access: {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: '15m',
    algorithm: 'HS256',
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
    algorithm: 'HS256',
  },
}

// JWT Payload
interface JwtPayload {
  sub: string;          // userId
  email: string;
  organizationId: string;
  roleId: string;
  roleSlug: string;
  permissions: string[];
  sessionId: string;
}
```

### 1.3 Password Security

| Aspect | Implementation |
|--------|----------------|
| Hashing | Argon2id (memory: 64MB, iterations: 3, parallelism: 4) |
| Min length | 8 characters |
| Complexity | Upper + lower + number required |
| Reset token | SHA-256 hashed, 1 hour expiry, single use |
| On password change | Revoke all refresh tokens |

### 1.4 Mobile Token Storage

```
✅ expo-secure-store → accessToken, refreshToken, deviceId
❌ AsyncStorage → NEVER for tokens
✅ Redux Persist → user profile, org metadata (non-sensitive)
```

### 1.5 CORS Configuration

```typescript
app.enableCors({
  origin: [
    process.env.MOBILE_APP_ORIGIN,
    'exp://localhost:8081',       // Dev only
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Organization-Id'],
  credentials: true,
});
```

### 1.6 Helmet Headers

```typescript
app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
```

### 1.7 Rate Limiting (Redis-backed)

```typescript
// Global: 100 req/min per user
// Auth routes: 5 req/min per IP
// Upload: 20 req/hour per user
// Report export: 10 req/hour per org

@UseGuards(ThrottlerGuard)
@Throttle({ default: { ttl: 60000, limit: 100 } })
```

### 1.8 File Upload Security

| Check | Rule |
|-------|------|
| Allowed MIME | `image/jpeg`, `image/png`, `application/pdf` |
| Max size | 10 MB |
| Filename | Sanitize, UUID-based R2 key |
| Access | Presigned URL, 15 min expiry |
| Bucket | Private, no public listing |

### 1.9 Audit Logging

Semua operasi sensitif dicatat via `AuditInterceptor`:

```typescript
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    const action = this.resolveAction(req.method);
    return next.handle().pipe(
      tap((response) => {
        this.auditService.log({
          userId: req.user.sub,
          organizationId: req.user.organizationId,
          action,
          entity: this.resolveEntity(req.url),
          entityId: response?.data?.id,
          newData: req.method !== 'GET' ? req.body : undefined,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }),
    );
  }
}
```

### 1.10 Permission Matrix

| Permission | SUPER_ADMIN | OWNER | FINANCE | STAFF | AUDITOR |
|------------|:-----------:|:-----:|:-------:|:-----:|:-------:|
| users:read | ✅ | ✅ | ❌ | ❌ | ❌ |
| users:create | ✅ | ✅ | ❌ | ❌ | ❌ |
| income:create | ✅ | ✅ | ✅ | ✅ | ❌ |
| income:delete | ✅ | ✅ | ✅ | ❌ | ❌ |
| expense:create | ✅ | ✅ | ✅ | ✅ | ❌ |
| approval:approve | ✅ | ✅ | ✅ | ❌ | ❌ |
| reports:export | ✅ | ✅ | ✅ | ❌ | ✅ |
| budget:manage | ✅ | ✅ | ✅ | ❌ | ❌ |
| accounting:manage | ✅ | ❌ | ✅ | ❌ | ❌ |
| audit:read | ✅ | ✅ | ❌ | ❌ | ✅ |

---

## 2. Deployment Architecture

### 2.1 Production Topology

```mermaid
flowchart TB
    subgraph USERS["Users"]
        IOS["iOS App"]
        AND["Android App"]
        TAB["Tablet App"]
    end

    subgraph EXPO["Expo EAS"]
        BUILD["EAS Build"]
        SUBMIT["EAS Submit → App Store / Play Store"]
        OTA["EAS Update (OTA patches)"]
    end

    subgraph RAILWAY["Railway / Render"]
        LB["Load Balancer"]
        API1["API Instance 1"]
        API2["API Instance 2"]
        WORKER["BullMQ Worker"]
    end

    subgraph DATA["Managed Services"]
        SUPA["Supabase PostgreSQL"]
        UPSTASH["Upstash Redis"]
        R2["Cloudflare R2"]
    end

    subgraph NOTIFY["Notifications"]
        FCM["Firebase FCM"]
    end

    IOS & AND & TAB --> BUILD
    BUILD --> SUBMIT
    IOS & AND & TAB <-->|REST API| LB
    LB --> API1 & API2
    API1 & API2 --> SUPA
    API1 & API2 --> UPSTASH
    API1 & API2 --> R2
    WORKER --> UPSTASH
    WORKER --> SUPA
    WORKER --> FCM
    IOS & AND & TAB --> FCM
    OTA --> IOS & AND & TAB
```

### 2.2 Environment Configuration

#### Backend `.env`

```env
# App
NODE_ENV=production
PORT=3000
API_URL=https://api.fms.app

# Database (Supabase)
DATABASE_URL=postgresql://user:pass@pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://user:pass@db.supabase.com:5432/postgres

# JWT
JWT_ACCESS_SECRET=<256-bit-random>
JWT_REFRESH_SECRET=<256-bit-random>

# Redis (Upstash)
REDIS_URL=rediss://default:pass@upstash-redis.upstash.io:6379

# Cloudflare R2
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=fms-attachments
R2_PUBLIC_URL=https://cdn.fms.app

# Firebase FCM
FCM_PROJECT_ID=xxx
FCM_CLIENT_EMAIL=xxx
FCM_PRIVATE_KEY=xxx

# Email (Optional)
SMTP_HOST=smtp.resend.com
SMTP_API_KEY=xxx
EMAIL_FROM=noreply@fms.app

# CORS
MOBILE_APP_ORIGIN=*
```

#### Mobile `.env`

```env
EXPO_PUBLIC_API_URL=https://api.fms.app/v1
EXPO_PUBLIC_R2_PUBLIC_URL=https://cdn.fms.app
EXPO_PUBLIC_FCM_SENDER_ID=xxx
```

### 2.3 Railway Deployment

```dockerfile
# docker/Dockerfile.api
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
```

**Railway Services:**

| Service | Type | Config |
|---------|------|--------|
| `fms-api` | Web | Dockerfile, 512MB RAM, auto-scale |
| `fms-worker` | Worker | Same image, `CMD: node dist/jobs/worker` |
| Custom domain | — | `api.fms.app` |

### 2.4 Supabase Setup

```
1. Create project (free tier)
2. Enable connection pooling (PgBouncer, port 6543)
3. Set DATABASE_URL (pooled) + DIRECT_URL (direct for migrations)
4. Optional: Enable RLS policies per table
5. Run: npx prisma migrate deploy
6. Run: npx prisma db seed
```

### 2.5 Cloudflare R2 Setup

```
1. Create bucket: fms-attachments (private)
2. Create API token with Object Read & Write
3. Configure CORS for presigned uploads
4. Optional: Custom domain via Cloudflare CDN
```

### 2.6 Expo EAS Build

```json
// eas.json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "channel": "production",
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "android": { "serviceAccountKeyPath": "./google-service-account.json" },
      "ios": { "appleId": "xxx", "ascAppId": "xxx" }
    }
  }
}
```

**Build Commands:**

```bash
# Development (Dev Client)
npx expo prebuild
npx expo run:android
npx expo run:ios

# Production
eas build --platform all --profile production
eas submit --platform all
```

### 2.7 CI/CD Pipeline

```mermaid
flowchart LR
    PUSH["Git Push"]
    LINT["Lint + Type Check"]
    TEST["Unit Tests"]
    BUILD_API["Build API Docker"]
    MIGRATE["Prisma Migrate"]
    DEPLOY["Deploy Railway"]
    EAS["EAS Build (on tag)"]

    PUSH --> LINT --> TEST --> BUILD_API --> MIGRATE --> DEPLOY
    PUSH -->|"tag v*"| EAS
```

#### GitHub Actions — API

```yaml
# .github/workflows/api-ci.yml
name: API CI/CD
on:
  push:
    branches: [main]
    paths: ['apps/api/**', 'prisma/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx prisma generate
      - run: npm run lint
      - run: npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: railwayapp/cli-action@v1
        with:
          command: up --service fms-api
```

### 2.8 Monitoring & Observability

| Aspect | Tool | Free Tier |
|--------|------|-----------|
| API logs | Railway logs | Included |
| Error tracking | Sentry | 5k events/month |
| Uptime | UptimeRobot | 50 monitors |
| DB monitoring | Supabase dashboard | Included |
| Redis monitoring | Upstash console | Included |

### 2.9 Backup Strategy

| Data | Strategy | Frequency |
|------|----------|-----------|
| PostgreSQL | Supabase auto backup | Daily (free tier: 7 days) |
| R2 attachments | R2 versioning | On upload |
| Redis | Upstash persistence | Automatic |

### 2.10 Scaling Path

| Milestone | Action |
|-----------|--------|
| 1k users | Current free tier sufficient |
| 5k users | Upgrade Supabase Pro, add API instance |
| 10k users | Read replica, Redis cache for dashboard |
| 50k users | Partition audit_logs, dedicated worker fleet |
| 100k+ users | Consider dedicated DB, CDN for API |

---

## 3. Phase 2 Deliverables Checklist

| # | Deliverable | File |
|---|-------------|------|
| 4 | Folder Structure | `docs/03-folder-structure.md` |
| 5 | REST API Endpoints | `docs/04-rest-api-endpoints.md` |
| 6 | NestJS Modules | `docs/05-nestjs-backend-spec.md` |
| 7 | DTO Lengkap | `docs/05-nestjs-backend-spec.md` §4 |
| 8 | Repository Pattern | `docs/05-nestjs-backend-spec.md` §2 |
| 9 | Authentication Flow | `docs/06-business-flows.md` §1 |
| 10 | Approval Flow | `docs/06-business-flows.md` §2 |
| 11 | Notification Flow | `docs/06-business-flows.md` §3 |
| 12 | Offline Sync Flow | `docs/06-business-flows.md` §4 |
| 13 | Accounting Flow | `docs/06-business-flows.md` §5 |
| 14 | Redux Toolkit Structure | `docs/07-mobile-frontend-spec.md` §2 |
| 15 | React Query Structure | `docs/07-mobile-frontend-spec.md` §3 |
| 16 | Expo Router Structure | `docs/07-mobile-frontend-spec.md` §4 |
| 17 | UI Screen List | `docs/07-mobile-frontend-spec.md` §5 |
| 18 | Dashboard Design | `docs/07-mobile-frontend-spec.md` §6 |
| 19 | Security Architecture | `docs/08-security-deployment.md` §1 |
| 20 | Deployment Architecture | `docs/08-security-deployment.md` §2 |

---

## 4. Next Phase (Implementation)

Fase 3 akan memulai implementasi kode:

1. Scaffold monorepo (`apps/api` + `apps/mobile`)
2. NestJS bootstrap + Prisma migrate + seed
3. Auth module (full implementation)
4. Core modules (income, expense, dashboard)
5. Expo mobile bootstrap + auth screens + dashboard
6. Offline sync engine
7. Accounting auto-journal
8. BullMQ reminder jobs
