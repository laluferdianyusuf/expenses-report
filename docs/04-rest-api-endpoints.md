# FMS Enterprise — REST API Endpoints

> Base URL: `https://api.fms.app/v1` | Auth: Bearer JWT | Tenant: `X-Organization-Id` header

---

## 1. Konvensi API

### Response Format

```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "timestamp": "2026-06-11T10:00:00.000Z"
}
```

### Error Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "field": "amount", "message": "Amount must be positive" }]
  },
  "timestamp": "2026-06-11T10:00:00.000Z"
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success (GET, PATCH) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden (RBAC) |
| 404 | Not found |
| 409 | Conflict (duplicate, sync conflict) |
| 429 | Rate limited |
| 500 | Server error |

### Common Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Default: 1 |
| `limit` | number | Default: 20, max: 100 |
| `sortBy` | string | Field name |
| `sortOrder` | `asc` \| `desc` | Default: desc |
| `search` | string | Full-text search |
| `startDate` | ISO date | Filter range start |
| `endDate` | ISO date | Filter range end |
| `branchId` | uuid | Branch filter |

---

## 2. Authentication — `/auth`

| Method | Endpoint | Auth | Permission | Description |
|--------|----------|------|------------|-------------|
| POST | `/auth/register` | Public | — | Register user + create organization |
| POST | `/auth/login` | Public | — | Login, return tokens + session |
| POST | `/auth/refresh` | Refresh Token | — | Rotate refresh token |
| POST | `/auth/logout` | JWT | — | Revoke current session |
| POST | `/auth/logout-all` | JWT | — | Revoke all sessions |
| POST | `/auth/forgot-password` | Public | — | Send reset email |
| POST | `/auth/reset-password` | Public | — | Reset with token |
| PATCH | `/auth/change-password` | JWT | — | Change password |
| GET | `/auth/me` | JWT | — | Current user profile |
| GET | `/auth/sessions` | JWT | — | List active sessions |
| DELETE | `/auth/sessions/:sessionId` | JWT | — | Revoke specific device |
| POST | `/auth/biometric/enable` | JWT | — | Enable biometric unlock |
| POST | `/auth/biometric/verify` | JWT | — | Verify biometric session |

### POST `/auth/register`

```json
// Request
{
  "name": "John Doe",
  "email": "john@ptabc.com",
  "password": "SecurePass123!",
  "phone": "+628123456789",
  "organizationName": "PT ABC",
  "deviceInfo": {
    "deviceId": "uuid",
    "deviceName": "Samsung Galaxy S24",
    "deviceType": "ANDROID",
    "fcmToken": "fcm-token"
  }
}

// Response 201
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "...", "email": "...", "role": "owner" },
    "organization": { "id": "...", "name": "PT ABC" },
    "tokens": { "accessToken": "...", "refreshToken": "...", "expiresIn": 900 }
  }
}
```

### POST `/auth/login`

```json
// Request
{
  "email": "john@ptabc.com",
  "password": "SecurePass123!",
  "organizationId": "optional-if-multi-org",
  "deviceInfo": { "deviceId": "...", "deviceName": "...", "deviceType": "ANDROID", "fcmToken": "..." }
}
```

### POST `/auth/refresh`

```json
// Request
{ "refreshToken": "..." }

// Response
{
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 900
  }
}
```

---

## 3. Users — `/users`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/users` | `users:read` | List users in organization |
| GET | `/users/:id` | `users:read` | Get user detail |
| POST | `/users` | `users:create` | Create user |
| PATCH | `/users/:id` | `users:update` | Update user |
| DELETE | `/users/:id` | `users:delete` | Soft delete user |
| PATCH | `/users/profile` | JWT | Update own profile |
| POST | `/users/profile/avatar` | JWT | Upload avatar |

### POST `/users`

```json
{
  "name": "Jane Staff",
  "email": "jane@ptabc.com",
  "phone": "+628987654321",
  "roleId": "uuid",
  "branchId": "uuid",
  "password": "TempPass123!"
}
```

---

## 4. Organizations — `/organizations`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/organizations/current` | JWT | Get current organization |
| PATCH | `/organizations/current` | `organizations:manage` | Update organization |
| POST | `/organizations/current/logo` | `organizations:manage` | Upload logo |
| GET | `/organizations/my` | JWT | List orgs user belongs to (multi-org future) |

### PATCH `/organizations/current`

```json
{
  "name": "PT ABC Updated",
  "email": "info@ptabc.com",
  "phone": "+62211234567",
  "address": "Jl. Sudirman No. 1, Jakarta"
}
```

---

## 5. Branches — `/branches`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/branches` | JWT | List branches |
| GET | `/branches/:id` | JWT | Get branch |
| POST | `/branches` | `organizations:manage` | Create branch |
| PATCH | `/branches/:id` | `organizations:manage` | Update branch |
| DELETE | `/branches/:id` | `organizations:manage` | Deactivate branch |

---

## 6. Roles & Permissions — `/roles`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/roles` | `users:read` | List roles |
| GET | `/roles/:id` | `users:read` | Role with permissions |
| GET | `/permissions` | SUPER_ADMIN | List all permissions |

---

## 7. Income — `/incomes`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/incomes` | `income:read` | List incomes (paginated, filterable) |
| GET | `/incomes/:id` | `income:read` | Get income detail |
| POST | `/incomes` | `income:create` | Create income |
| PATCH | `/incomes/:id` | `income:update` | Update income |
| DELETE | `/incomes/:id` | `income:delete` | Soft delete income |
| GET | `/incomes/summary` | `income:read` | Summary by period |
| GET | `/incomes/export` | `reports:export` | Export CSV/Excel |

### POST `/incomes`

```json
{
  "branchId": "uuid",
  "categoryId": "uuid",
  "amount": 1500000.00,
  "transactionDate": "2026-06-11",
  "sourceName": "Customer A",
  "description": "Penjualan produk X",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "localId": "local-uuid-for-offline-sync"
}
```

### GET `/incomes` Query

```
?startDate=2026-06-01&endDate=2026-06-30&categoryId=uuid&branchId=uuid&page=1&limit=20
```

---

## 8. Income Categories — `/income-categories`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/income-categories` | `income:read` | List categories |
| POST | `/income-categories` | `organizations:manage` | Create custom category |
| PATCH | `/income-categories/:id` | `organizations:manage` | Update category |
| DELETE | `/income-categories/:id` | `organizations:manage` | Deactivate category |

---

## 9. Expense — `/expenses`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/expenses` | `expense:read` | List expenses |
| GET | `/expenses/:id` | `expense:read` | Get expense detail |
| POST | `/expenses` | `expense:create` | Create expense (DRAFT) |
| PATCH | `/expenses/:id` | `expense:update` | Update expense |
| DELETE | `/expenses/:id` | `expense:delete` | Soft delete |
| GET | `/expenses/summary` | `expense:read` | Summary by period |
| GET | `/expenses/export` | `reports:export` | Export |

### POST `/expenses`

```json
{
  "branchId": "uuid",
  "categoryId": "uuid",
  "amount": 500000.00,
  "transactionDate": "2026-06-11",
  "vendorName": "Vendor B",
  "description": "Pembelian supplies",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "localId": "local-uuid"
}
```

---

## 10. Expense Categories — `/expense-categories`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/expense-categories` | `expense:read` | List categories |
| POST | `/expense-categories` | `organizations:manage` | Create |
| PATCH | `/expense-categories/:id` | `organizations:manage` | Update |
| DELETE | `/expense-categories/:id` | `organizations:manage` | Deactivate |

---

## 11. Budget — `/budgets`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/budgets` | `budget:manage` | List budgets |
| GET | `/budgets/:id` | `budget:manage` | Budget detail + history |
| POST | `/budgets` | `budget:manage` | Create budget |
| PATCH | `/budgets/:id` | `budget:manage` | Update budget amount |
| DELETE | `/budgets/:id` | `budget:manage` | Deactivate |
| GET | `/budgets/monitoring` | `analytics:read` | All budgets with alert levels |
| GET | `/budgets/:id/history` | `budget:manage` | Budget change history |

### POST `/budgets`

```json
{
  "categoryId": "uuid",
  "budgetAmount": 10000000.00,
  "period": "MONTHLY",
  "startDate": "2026-06-01",
  "endDate": "2026-06-30"
}
```

---

## 12. Cash Flow — `/cashflow`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/cashflow` | `analytics:read` | Cash flow summary |
| GET | `/cashflow/trend` | `analytics:read` | Cash flow trend chart data |

### GET `/cashflow`

```
?period=DAILY|WEEKLY|MONTHLY|YEARLY|CUSTOM&startDate=2026-01-01&endDate=2026-06-30&branchId=uuid
```

```json
// Response
{
  "data": {
    "openingBalance": 50000000.00,
    "totalIncome": 25000000.00,
    "totalExpense": 18000000.00,
    "closingBalance": 57000000.00,
    "period": "MONTHLY",
    "startDate": "2026-06-01",
    "endDate": "2026-06-30"
  }
}
```

---

## 13. Financial Target — `/targets`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/targets` | `target:manage` | List targets |
| GET | `/targets/:id` | `target:manage` | Target detail + progress |
| POST | `/targets` | `target:manage` | Create target |
| PATCH | `/targets/:id` | `target:manage` | Update target |
| DELETE | `/targets/:id` | `target:manage` | Cancel target |
| POST | `/targets/:id/contribute` | `target:manage` | Add to currentAmount |

---

## 14. Approval — `/approvals`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/approvals` | `expense:read` | List approval flows |
| GET | `/approvals/pending` | `approval:approve` | Pending for current user |
| GET | `/approvals/:id` | `expense:read` | Approval detail + history |
| POST | `/approvals/submit` | `expense:create` | Submit expense for approval |
| POST | `/approvals/:id/approve` | `approval:approve` | Approve |
| POST | `/approvals/:id/reject` | `approval:reject` | Reject with reason |
| POST | `/approvals/:id/cancel` | `expense:create` | Cancel submission |

### POST `/approvals/submit`

```json
{ "entityType": "EXPENSE", "entityId": "uuid" }
```

### POST `/approvals/:id/reject`

```json
{ "comment": "Bukti transaksi tidak lengkap" }
```

---

## 15. Audit — `/audit-logs`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/audit-logs` | `audit:read` | List audit logs |
| GET | `/audit-logs/:id` | `audit:read` | Audit detail |

```
?action=CREATE|UPDATE|DELETE&entity=income&entityId=uuid&userId=uuid&startDate=&endDate=
```

---

## 16. Notifications — `/notifications`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/notifications` | JWT | List notifications |
| GET | `/notifications/unread-count` | JWT | Unread count |
| PATCH | `/notifications/:id/read` | JWT | Mark as read |
| PATCH | `/notifications/read-all` | JWT | Mark all read |
| PATCH | `/notifications/:id/archive` | JWT | Archive |
| POST | `/notifications/register-device` | JWT | Register FCM token |

---

## 17. Analytics — `/analytics`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/analytics/overview` | `analytics:read` | Dashboard analytics |
| GET | `/analytics/income-trend` | `analytics:read` | Income trend |
| GET | `/analytics/expense-trend` | `analytics:read` | Expense trend |
| GET | `/analytics/cashflow-trend` | `analytics:read` | Cash flow trend |
| GET | `/analytics/top-categories` | `analytics:read` | Top income/expense categories |
| GET | `/analytics/monthly-comparison` | `analytics:read` | Month-over-month |
| GET | `/analytics/growth-rate` | `analytics:read` | Growth rate |
| GET | `/analytics/health-score` | `analytics:read` | Financial health score |

---

## 18. Dashboard — `/dashboard`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/dashboard` | JWT | Aggregated dashboard data |
| GET | `/dashboard/quick-stats` | JWT | Today + month stats |

```json
// GET /dashboard Response
{
  "data": {
    "today": { "income": 2500000, "expense": 1200000, "profit": 1300000 },
    "thisMonth": { "income": 45000000, "expense": 32000000, "profit": 13000000 },
    "currentBalance": 87500000,
    "pendingApprovals": 3,
    "budgetAlerts": 2,
    "unreadNotifications": 5,
    "recentTransactions": [],
    "healthScore": 78
  }
}
```

---

## 19. Reports — `/reports`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/reports` | `reports:read` | List generated reports |
| GET | `/reports/:id` | `reports:read` | Report detail |
| POST | `/reports/generate` | `reports:export` | Queue report generation |
| GET | `/reports/:id/download` | `reports:read` | Download file |

### POST `/reports/generate`

```json
{
  "reportType": "MONTHLY",
  "format": "PDF",
  "startDate": "2026-06-01",
  "endDate": "2026-06-30",
  "branchId": "optional-uuid"
}
```

---

## 20. Accounting — `/accounting`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/accounting/chart-of-accounts` | `accounting:read` | List COA |
| POST | `/accounting/chart-of-accounts` | `accounting:manage` | Create account |
| PATCH | `/accounting/chart-of-accounts/:id` | `accounting:manage` | Update account |
| GET | `/accounting/journal-entries` | `accounting:read` | List journal entries |
| GET | `/accounting/journal-entries/:id` | `accounting:read` | Journal detail |
| POST | `/accounting/journal-entries` | `accounting:manage` | Manual journal entry |
| POST | `/accounting/journal-entries/:id/post` | `accounting:manage` | Post draft entry |
| POST | `/accounting/journal-entries/:id/void` | `accounting:manage` | Void entry |
| GET | `/accounting/trial-balance` | `accounting:read` | Trial balance |
| GET | `/accounting/balance-sheet` | `accounting:read` | Balance sheet |
| GET | `/accounting/profit-loss` | `accounting:read` | P&L statement |
| GET | `/accounting/cash-flow-statement` | `accounting:read` | Cash flow statement |

---

## 21. Upload — `/upload`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | `/upload/presigned-url` | JWT | Get R2 presigned upload URL |
| POST | `/upload/confirm` | JWT | Confirm upload complete |
| DELETE | `/upload/:attachmentId` | JWT | Delete attachment |

### POST `/upload/presigned-url`

```json
{
  "fileName": "receipt.jpg",
  "mimeType": "image/jpeg",
  "fileSize": 204800,
  "entityType": "EXPENSE",
  "entityId": "uuid"
}
```

---

## 22. Sync — `/sync`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | `/sync/push` | JWT | Push offline changes to server |
| GET | `/sync/pull` | JWT | Pull server changes since timestamp |
| GET | `/sync/status` | JWT | Last sync status |
| POST | `/sync/resolve-conflict` | JWT | Resolve sync conflict |

### POST `/sync/push`

```json
{
  "deviceId": "uuid",
  "items": [
    {
      "entityType": "INCOME",
      "entityId": "local-uuid",
      "action": "CREATE",
      "payload": { "amount": 100000, "categoryId": "...", "transactionDate": "2026-06-11" },
      "clientTimestamp": "2026-06-11T08:00:00Z"
    }
  ]
}
```

### GET `/sync/pull`

```
?since=2026-06-10T00:00:00Z&entities=income,expense,notification
```

---

## 23. API Endpoint Summary

| Module | Endpoints |
|--------|-----------|
| Auth | 12 |
| Users | 7 |
| Organizations | 4 |
| Branches | 5 |
| Roles | 3 |
| Income | 7 |
| Income Categories | 4 |
| Expense | 7 |
| Expense Categories | 4 |
| Budget | 7 |
| Cash Flow | 2 |
| Target | 6 |
| Approval | 7 |
| Audit | 2 |
| Notifications | 6 |
| Analytics | 8 |
| Dashboard | 2 |
| Reports | 4 |
| Accounting | 12 |
| Upload | 3 |
| Sync | 4 |
| **Total** | **~116 endpoints** |

---

## 24. Rate Limiting per Route Group

| Group | Limit |
|-------|-------|
| `/auth/login`, `/auth/register` | 5/min per IP |
| `/auth/forgot-password` | 3/min per email |
| `/upload/*` | 20/hour per user |
| `/reports/generate` | 10/hour per org |
| `/sync/push` | 60/min per device |
| All other authenticated | 100/min per user |
