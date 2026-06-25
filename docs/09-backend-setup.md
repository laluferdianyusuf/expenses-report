# FMS Backend — Setup & Run Guide

## Prerequisites

- Node.js 20+
- Docker (optional, for local PostgreSQL)
- PostgreSQL database (local Docker or Supabase)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL (Docker)

```bash
docker compose -f docker/docker-compose.yml up -d
```

### 3. Configure environment

Copy `apps/api/.env.example` to `apps/api/.env` and set:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fms?schema=public
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/fms?schema=public
JWT_ACCESS_SECRET=your-32-char-secret-here
JWT_REFRESH_SECRET=your-32-char-secret-here
```

### 4. Database migrate & seed

```bash
npx prisma db push
npm run db:seed
```

### 5. Run API

```bash
npm run api:dev
```

- API: `http://localhost:3000/v1`
- Swagger: `http://localhost:3000/docs`

## Implemented Modules

| Module | Endpoints | Status |
|--------|-----------|--------|
| Auth | register, login, refresh, logout, me, sessions | ✅ |
| Users | CRUD + profile | ✅ |
| Organizations | get/update current | ✅ |
| Branches | CRUD | ✅ |
| Incomes | CRUD + summary + categories | ✅ |
| Expenses | CRUD + summary + categories | ✅ |
| Approvals | submit, approve, reject, cancel, pending | ✅ |
| Budgets | CRUD + monitoring | ✅ |
| Dashboard | aggregated stats | ✅ |
| Notifications | list, unread, mark read | ✅ |
| Audit Logs | list | ✅ |
| Accounting | auto journal on income/expense approve | ✅ |
| **Sync** | push, pull, status, resolve-conflict | ✅ |
| **Analytics** | trends, categories, health score, growth | ✅ |
| **Jobs** | BullMQ reminders (5 cron jobs) | ✅ |
| **Upload (R2)** | presigned URL, confirm, delete | ✅ |
| **Reports** | PDF, Excel, CSV via BullMQ queue | ✅ |
| **FCM Push** | Firebase push on notifications | ✅ |

## Background Jobs (BullMQ)

Requires Redis. Start with Docker:

```bash
docker compose -f docker/docker-compose.yml up -d redis
```

Set in `apps/api/.env`:

```env
REDIS_URL=redis://localhost:6379
JOBS_ENABLED=true
```

| Job | Schedule | Description |
|-----|----------|-------------|
| `daily-transaction-reminder` | 20:00 daily | No transaction today |
| `income-7day-reminder` | Mon 09:00 | No income in 7 days |
| `expense-7day-reminder` | Wed 09:00 | No expense in 7 days |
| `target-reminder` | 08:00 daily | Target near deadline |
| `monthly-report-reminder` | 1st 09:00 | Monthly report due |

Disable jobs without Redis: `JOBS_ENABLED=false`

## Sync API

```bash
# Push offline changes
curl -X POST http://localhost:3000/v1/sync/push \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "dev-1",
    "items": [{
      "entityType": "INCOME",
      "entityId": "local-uuid-1",
      "action": "CREATE",
      "payload": { "categoryId": "...", "amount": 100000, "transactionDate": "2026-06-11" },
      "clientTimestamp": "2026-06-11T10:00:00Z"
    }]
  }'

# Pull server changes
curl "http://localhost:3000/v1/sync/pull?since=2026-06-01T00:00:00Z&entities=income,expense" \
  -H "Authorization: Bearer <token>"
```

## Analytics API

```bash
curl "http://localhost:3000/v1/analytics/overview?period=MONTHLY" \
  -H "Authorization: Bearer <token>"

curl "http://localhost:3000/v1/analytics/health-score" \
  -H "Authorization: Bearer <token>"
```

## Cloudflare R2 Setup

1. Create bucket `fms-attachments` (private)
2. Create API token with Object Read & Write
3. Configure in `apps/api/.env`:

```env
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=fms-attachments
R2_PUBLIC_URL=https://cdn.yourdomain.com
```

### Upload Flow

```bash
# 1. Get presigned URL
curl -X POST http://localhost:3000/v1/upload/presigned-url \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "receipt.jpg",
    "mimeType": "image/jpeg",
    "fileSize": 204800,
    "entityType": "EXPENSE",
    "entityId": "<expense-uuid>"
  }'

# 2. PUT file to uploadUrl (from response)

# 3. Confirm upload
curl -X POST http://localhost:3000/v1/upload/confirm \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "attachmentId": "<attachment-uuid>" }'
```

## Reports API

```bash
# Queue report generation
curl -X POST http://localhost:3000/v1/reports/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "MONTHLY",
    "format": "PDF",
    "startDate": "2026-06-01",
    "endDate": "2026-06-30"
  }'

# Check status
curl http://localhost:3000/v1/reports/<report-id> \
  -H "Authorization: Bearer <token>"

# Download (presigned URL)
curl http://localhost:3000/v1/reports/<report-id>/download \
  -H "Authorization: Bearer <token>"
```

Formats: `PDF`, `EXCEL`, `CSV` | Types: `INCOME`, `EXPENSE`, `MONTHLY`, `BUDGET`, `CASH_FLOW`, etc.

## Firebase FCM Setup

1. Create Firebase project → Project Settings → Service Accounts
2. Generate new private key (JSON)
3. Configure in `apps/api/.env`:

```env
FCM_PROJECT_ID=your-project-id
FCM_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Register Device Token

```bash
curl -X POST http://localhost:3000/v1/notifications/register-device \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "fcmToken": "<device-fcm-token>", "deviceId": "dev-1" }'
```

Push is sent automatically when in-app notifications are created (approval, budget alerts, reminders).

## Test Flow

```bash
# Register
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@test.com",
    "password": "SecurePass123",
    "organizationName": "PT ABC",
    "deviceInfo": { "deviceId": "dev-1", "deviceType": "ANDROID" }
  }'

# Login → use accessToken for subsequent requests
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@test.com",
    "password": "SecurePass123",
    "deviceInfo": { "deviceId": "dev-1", "deviceType": "ANDROID" }
  }'

# Dashboard
curl http://localhost:3000/v1/dashboard \
  -H "Authorization: Bearer <accessToken>"
```

## Project Structure

```
apps/api/src/
├── common/          # Guards, decorators, filters, utils
├── database/        # Prisma module, seed helpers
├── modules/
│   ├── auth/
│   ├── users/
│   ├── organizations/
│   ├── branches/
│   ├── income/
│   ├── expense/
│   ├── approval/
│   ├── budget/
│   ├── dashboard/
│   ├── notifications/
│   ├── audit/
│   ├── accounting/
│   ├── sync/
│   └── analytics/
├── modules/upload/  # R2 presigned upload
├── modules/report/  # PDF/Excel/CSV generators
├── jobs/            # BullMQ processors & schedulers
├── app.module.ts
└── main.ts
```

## Remaining Backend Work

- Target & Cashflow dedicated modules
- Mobile app (`apps/mobile`)
