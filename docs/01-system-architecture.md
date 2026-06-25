# FMS Enterprise — System Architecture

> Financial Management System | Production-Ready | Multi-Tenant | Offline-First

---

## 1. Executive Summary

FMS adalah platform SaaS enterprise untuk pencatatan, analitik, dan monitoring keuangan organisasi (individu, UMKM, komunitas, yayasan, koperasi, multi-cabang). Sistem dirancang untuk skala puluhan ribu pengguna aktif dengan isolasi data per tenant, offline-first mobile, double-entry accounting, dan approval workflow.

---

## 2. High-Level Architecture

```mermaid
flowchart TB
    subgraph CLIENT["Client Layer"]
        MOBILE["Expo Mobile App<br/>(Android / iOS / Tablet)"]
        MOBILE --> SQLITE["Expo SQLite<br/>(Local DB)"]
        MOBILE --> REDUX["Redux Toolkit + Persist"]
        MOBILE --> RQ["TanStack Query"]
        MOBILE --> SECURE["Expo Secure Store<br/>(Tokens)"]
    end

    subgraph EDGE["Edge & CDN"]
        R2["Cloudflare R2<br/>(Attachments)"]
        CDN["CDN / Public URLs"]
    end

    subgraph BACKEND["Backend Layer — NestJS"]
        API["REST API Gateway"]
        AUTH["Auth Module<br/>JWT + Refresh Rotation"]
        RBAC["RBAC Guard"]
        MODULES["Domain Modules<br/>Income, Expense, Budget, etc."]
        ACCT["Accounting Module<br/>Double Entry"]
        JOBS["BullMQ Workers"]
        SWAGGER["Swagger / OpenAPI"]
    end

    subgraph DATA["Data Layer"]
        PG["Supabase PostgreSQL"]
        REDIS["Upstash Redis<br/>(Cache + Queue)"]
    end

    subgraph EXTERNAL["External Services"]
        FCM["Firebase FCM<br/>(Push Notifications)"]
        EAS["Expo EAS<br/>(Build & OTA)"]
        EMAIL["Email Provider<br/>(Optional — Resend/SMTP)"]
    end

    subgraph HOSTING["Hosting"]
        RAILWAY["Railway / Render<br/>(API + Workers)"]
    end

    MOBILE <-->|"HTTPS REST + Sync"| API
    MOBILE -->|"Upload when online"| R2
    R2 --> CDN
    API --> AUTH
    AUTH --> RBAC
    RBAC --> MODULES
    MODULES --> ACCT
    MODULES --> PG
    API --> REDIS
    JOBS --> REDIS
    JOBS --> PG
    JOBS --> FCM
    JOBS --> EMAIL
    API --> R2
    BACKEND --> HOSTING
    MOBILE --> FCM
    MOBILE --> EAS
```

---

## 3. Architecture Layers

### 3.1 Presentation Layer (Mobile)

| Komponen | Teknologi | Tanggung Jawab |
|----------|-----------|----------------|
| Navigation | Expo Router | File-based routing, auth groups, tab layout |
| UI | NativeWind + Reanimated | Design system, dark mode, skeleton, animations |
| State (Client) | Redux Toolkit + Persist | Auth, org context, offline queue, UI prefs |
| State (Server) | TanStack Query | API cache, optimistic updates, invalidation |
| Forms | React Hook Form + Zod | Validasi client-side |
| Local DB | Expo SQLite | Income, expense, categories, notifications, sync_queue |
| Security | Secure Store + Local Auth | Token, device ID, biometric unlock |
| Charts | Victory Native XL | Dashboard analytics |
| Offline | Sync Engine | Queue-based bidirectional sync |

### 3.2 API Layer (NestJS)

| Komponen | Pola | Tanggung Jawab |
|----------|------|----------------|
| Controllers | REST | HTTP endpoints, DTO validation |
| Services | Use Cases | Business logic orchestration |
| Repositories | Repository Pattern | Data access abstraction |
| Guards | JWT + RBAC + Tenant | AuthN, permission, org isolation |
| Interceptors | Audit, Transform | Logging, response shaping |
| Pipes | class-validator | Input sanitization |
| Filters | Exception | Standardized error responses |
| Jobs | BullMQ | Reminders, reports, email, push |

### 3.3 Data Layer

| Store | Purpose |
|-------|---------|
| PostgreSQL (Supabase) | Primary relational store, multi-tenant |
| Redis (Upstash) | Session cache, rate limit, BullMQ |
| Cloudflare R2 | Attachment storage (JPG, PNG, PDF) |
| SQLite (Mobile) | Offline-first local persistence |

---

## 4. Multi-Tenant Architecture

```mermaid
flowchart LR
    subgraph TENANT_ISOLATION["Tenant Isolation Strategy"]
        REQ["Incoming Request"]
        JWT_DEC["Decode JWT"]
        ORG_CTX["Extract organizationId"]
        GUARD["TenantGuard"]
        QUERY["Repository Query<br/>WHERE organizationId = :orgId"]
    end

    REQ --> JWT_DEC --> ORG_CTX --> GUARD --> QUERY

    subgraph ORGS["Organizations (Tenants)"]
        O1["PT ABC"]
        O2["PT XYZ"]
        O3["Yayasan XYZ"]
        O4["Komunitas NTB"]
    end

    O1 -.->|"isolated data"| QUERY
    O2 -.->|"isolated data"| QUERY
    O3 -.->|"isolated data"| QUERY
    O4 -.->|"isolated data"| QUERY
```

### Prinsip Isolasi

1. **Shared Database, Shared Schema** — Satu database PostgreSQL, kolom `organizationId` di setiap tabel transaksi.
2. **Row-Level Security (RLS)** — Opsional di Supabase untuk defense-in-depth.
3. **Application-Level Guard** — `TenantGuard` + repository base class memaksa filter `organizationId`.
4. **SUPER_ADMIN** — Bypass tenant filter hanya untuk operasi platform-wide (audit, support).

### Tenant Context Flow

```
Request → JwtAuthGuard → TenantGuard → PermissionGuard → Controller → Service → Repository
                ↓              ↓
           userId         organizationId (from JWT claim or header X-Organization-Id)
```

---

## 5. Authentication Architecture

```mermaid
sequenceDiagram
    participant App as Mobile App
    participant API as Auth API
    participant DB as PostgreSQL
    participant Redis as Redis
    participant Secure as Secure Store

    App->>API: POST /auth/login (email, password, deviceInfo)
    API->>DB: Validate user + Argon2 verify
    API->>DB: Create UserSession + RefreshToken
    API->>Redis: Cache session (optional)
    API-->>App: accessToken (15m) + refreshToken (7d)
    App->>Secure: Store tokens + deviceId

    Note over App,API: Access Token Expired
    App->>API: POST /auth/refresh (refreshToken)
    API->>DB: Validate refresh token (not revoked)
    API->>DB: Revoke old token (rotation)
    API->>DB: Issue new refresh token
    API-->>App: New accessToken + refreshToken
    App->>Secure: Update tokens

    App->>API: POST /auth/logout
    API->>DB: Revoke refresh token + session
    App->>Secure: Clear tokens
```

### Token Strategy

| Token | Lifetime | Storage (Mobile) | Claims |
|-------|----------|------------------|--------|
| Access Token | 15 menit | Secure Store (memory cache) | sub, email, orgId, roleId, permissions[] |
| Refresh Token | 7 hari | Secure Store | tokenId, userId, deviceId |

### Biometric Login Flow

```
App Launch → Check Secure Store tokens → Prompt biometric → 
Unlock tokens → Validate/refresh if needed → Navigate to dashboard
```

---

## 6. Offline-First Sync Architecture

```mermaid
flowchart TB
    subgraph ONLINE["Online Mode"]
        UI1["User Action"]
        API1["Direct API Call"]
        CACHE1["TanStack Query Cache Update"]
        UI1 --> API1 --> CACHE1
    end

    subgraph OFFLINE["Offline Mode"]
        UI2["User Action"]
        SQLITE2["Write to SQLite"]
        QUEUE2["Enqueue sync_queue"]
        UI3["Optimistic UI Update"]
        UI2 --> SQLITE2 --> QUEUE2 --> UI3
    end

    subgraph SYNC["Sync Engine (Background)"]
        NET["Network Listener<br/>expo-network"]
        WORKER["Sync Worker"]
        PROC["Process PENDING queue<br/>FIFO + retry backoff"]
        UPLOAD["Upload local files → R2"]
        NET -->|"online"| WORKER --> PROC
        PROC --> UPLOAD
        PROC -->|"success"| CLEAN["Mark SUCCESS / Delete"]
        PROC -->|"fail"| RETRY["retryCount++ / FAILED"]
    end

    QUEUE2 -.-> WORKER
```

### Sync Queue States

```
PENDING → SYNCING → SUCCESS (delete)
                 ↘ FAILED (retry if retryCount < 5)
```

### Conflict Resolution

| Strategi | Aturan |
|----------|--------|
| Last-Write-Wins | Default untuk income/expense |
| Server Authority | Approval status, accounting entries |
| Merge | Budget usedAmount (server recalculates) |

---

## 7. Approval Workflow Architecture

```mermaid
stateDiagram-v2
    [*] --> DRAFT: STAFF creates
    DRAFT --> PENDING: STAFF submits
    PENDING --> APPROVED: FINANCE or OWNER approves
    PENDING --> REJECTED: FINANCE or OWNER rejects
    PENDING --> CANCELLED: Creator cancels
    APPROVED --> [*]
    REJECTED --> DRAFT: Resubmit allowed
    CANCELLED --> [*]
```

### Role dalam Workflow

| Role | Aksi |
|------|------|
| STAFF | Create (DRAFT), Submit (PENDING) |
| FINANCE | Approve, Reject, Edit before approve |
| OWNER | Final approve, view all |
| AUDITOR | Read-only + history |

---

## 8. Double-Entry Accounting Architecture

```mermaid
flowchart LR
    TX["Income / Expense Transaction"]
    SVC["AccountingService"]
    JE["Journal Entry"]
    JD1["Journal Detail (Debit)"]
    JD2["Journal Detail (Credit)"]
    GL["General Ledger Update"]
    TB["Trial Balance"]
    BS["Balance Sheet"]
    PL["Profit & Loss"]

    TX --> SVC --> JE
    JE --> JD1
    JE --> JD2
    JD1 --> GL
    JD2 --> GL
    GL --> TB
    GL --> BS
    GL --> PL
```

### Auto Journal Mapping (Contoh)

| Transaksi | Debit | Credit |
|-----------|-------|--------|
| Income — Penjualan | Cash/Bank (ASSET) | Revenue — Penjualan (REVENUE) |
| Expense — Gaji | Expense — Gaji (EXPENSE) | Cash/Bank (ASSET) |

---

## 9. Notification Architecture

```mermaid
flowchart TB
    TRIGGER["Event Triggers<br/>Budget 80%, Approval, Reminder Cron"]
    SVC["NotificationService"]
    DB["notifications table"]
    FCM_SVC["FCM Push Service"]
    INAPP["In-App Badge"]
    EMAIL_SVC["Email Service (Optional)"]

    TRIGGER --> SVC
    SVC --> DB
    SVC --> FCM_SVC
    SVC --> INAPP
    SVC --> EMAIL_SVC
```

### Reminder Cron Jobs (BullMQ)

| Job | Schedule | Kondisi |
|-----|----------|---------|
| daily-transaction-reminder | 20:00 daily | No transaction today |
| income-7day-reminder | Weekly | No income in 7 days |
| expense-7day-reminder | Weekly | No expense in 7 days |
| budget-warning | On budget update | 80% / 90% / over |
| target-reminder | Daily | Target < 100% near deadline |
| monthly-report-reminder | 1st of month | No report generated |

---

## 10. Security Architecture

```mermaid
flowchart TB
    subgraph PERIMETER["Perimeter Security"]
        HTTPS["HTTPS/TLS Only"]
        CORS["CORS Whitelist"]
        HELMET["Helmet Headers"]
        RATE["Rate Limiter<br/>(Redis-backed)"]
    end

    subgraph AUTHZ["Authentication & Authorization"]
        JWT_G["JWT Guard"]
        RBAC_G["RBAC Permission Guard"]
        TENANT_G["Tenant Guard"]
        ARGON["Argon2 Password Hash"]
        ROTATE["Refresh Token Rotation"]
    end

    subgraph DATA_SEC["Data Security"]
        VALID["Input Validation (Zod/class-validator)"]
        PRISMA["Prisma ORM (SQL Injection Protection)"]
        AUDIT["Audit Trail Logging"]
        FILE_VAL["File Type/Size Validation"]
        XSS["Output Encoding"]
    end

    PERIMETER --> AUTHZ --> DATA_SEC
```

### Rate Limiting Tiers

| Endpoint Group | Limit |
|----------------|-------|
| Auth (login, register) | 5 req/min per IP |
| General API | 100 req/min per user |
| Report export | 10 req/hour per org |
| File upload | 20 req/hour per user |

---

## 11. Deployment Architecture

```mermaid
flowchart TB
    subgraph DEV["Development"]
        DEV_CLIENT["Expo Dev Client"]
        LOCAL_API["NestJS Local"]
        LOCAL_DB["Supabase Dev DB"]
    end

    subgraph STAGING["Staging"]
        EAS_PREVIEW["EAS Preview Build"]
        RAILWAY_STG["Railway Staging"]
    end

    subgraph PROD["Production"]
        EAS_PROD["EAS Production Build<br/>App Store + Play Store"]
        RAILWAY_PROD["Railway Production<br/>API + Worker"]
        SUPABASE_PROD["Supabase PostgreSQL"]
        UPSTASH_PROD["Upstash Redis"]
        R2_PROD["Cloudflare R2"]
        FCM_PROD["Firebase FCM"]
    end

    DEV --> STAGING --> PROD
```

### Environment Matrix

| Service | Dev | Staging | Production |
|---------|-----|---------|------------|
| API | localhost:3000 | Railway staging | Railway prod |
| DB | Supabase dev project | Supabase staging | Supabase prod |
| Redis | Upstash dev | Upstash staging | Upstash prod |
| R2 | Dev bucket | Staging bucket | Prod bucket |
| Mobile | `expo run:android/ios` | EAS internal | EAS store |

---

## 12. Scalability Considerations

| Aspek | Strategi |
|-------|----------|
| Horizontal API scaling | Stateless NestJS instances behind Railway load balancer |
| Database | Connection pooling (PgBouncer via Supabase), indexed `organizationId` |
| Caching | Redis for dashboard aggregates, permission cache |
| File storage | R2 unlimited scale, presigned URLs |
| Background jobs | Separate BullMQ worker process |
| Mobile sync | Batched sync (max 50 items per batch), exponential backoff |
| Read replicas | Supabase read replica when traffic > 10k DAU |

---

## 13. Technology Decision Records (Summary)

| Keputusan | Alasan |
|-----------|--------|
| NestJS + Clean Architecture | Modular, testable, enterprise patterns |
| Prisma ORM | Type-safe, migration-friendly |
| Expo Dev Client (bukan Go) | Native modules: SQLite, biometrics, camera |
| Redux Persist + SQLite | Dual offline persistence strategy |
| BullMQ + Redis | Reliable job scheduling |
| Shared-schema multi-tenant | Cost-effective untuk free tier, scalable dengan RLS |
| Double-entry accounting | Professional financial reporting |

---

## 14. Next Phase

Setelah dokumen ini disetujui, lanjut ke:

- **Fase 1b**: Database ERD Lengkap → `docs/02-database-erd.md`
- **Fase 1c**: Prisma Schema Lengkap → `prisma/schema.prisma`
- **Fase 2**: REST API Endpoints, NestJS Modules, DTOs
- **Fase 3**: Mobile structure, Redux, React Query
- **Fase 4**: Implementation
