# FMS Enterprise — Database ERD

> Entity Relationship Diagram | PostgreSQL | Multi-Tenant

---

## 1. ERD Overview (Core Domain)

```mermaid
erDiagram
    organizations ||--o{ branches : has
    organizations ||--o{ users : employs
    organizations ||--o{ income_categories : defines
    organizations ||--o{ expense_categories : defines
    organizations ||--o{ incomes : records
    organizations ||--o{ expenses : records
    organizations ||--o{ budgets : plans
    organizations ||--o{ targets : sets
    organizations ||--o{ notifications : receives
    organizations ||--o{ approval_flows : configures
    organizations ||--o{ audit_logs : tracks
    organizations ||--o{ reports : generates
    organizations ||--o{ chart_of_accounts : maintains
    organizations ||--o{ journal_entries : posts

    branches ||--o{ users : assigns
    branches ||--o{ incomes : locates
    branches ||--o{ expenses : locates

    roles ||--o{ users : assigns
    roles ||--o{ role_permissions : has
    permissions ||--o{ role_permissions : granted

    users ||--o{ user_sessions : opens
    users ||--o{ refresh_tokens : owns
    users ||--o{ incomes : creates
    users ||--o{ expenses : creates
    users ||--o{ audit_logs : performs
    users ||--o{ notifications : receives
    users ||--o{ approval_histories : acts

    income_categories ||--o{ incomes : categorizes
    expense_categories ||--o{ expenses : categorizes
    expense_categories ||--o{ budgets : limits

    incomes ||--o| approval_flows : requires
    expenses ||--o| approval_flows : requires
    approval_flows ||--o{ approval_histories : logs

    incomes ||--o{ attachments : has
    expenses ||--o{ attachments : has

    budgets ||--o{ budget_histories : tracks

    chart_of_accounts ||--o{ journal_details : posts
    journal_entries ||--|{ journal_details : contains
    incomes ||--o| journal_entries : generates
    expenses ||--o| journal_entries : generates

    organizations {
        uuid id PK
        string name
        string email
        string phone
        string address
        string logo
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    branches {
        uuid id PK
        uuid organizationId FK
        string name
        string address
        string phone
        string email
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    roles {
        uuid id PK
        string name UK
        string slug UK
        string description
        boolean isSystem
        datetime createdAt
    }

    permissions {
        uuid id PK
        string name UK
        string slug UK
        string module
        string action
        datetime createdAt
    }

    role_permissions {
        uuid id PK
        uuid roleId FK
        uuid permissionId FK
    }

    users {
        uuid id PK
        uuid organizationId FK
        uuid branchId FK
        uuid roleId FK
        string name
        string email UK
        string phone
        string passwordHash
        string avatar
        enum status
        datetime lastLogin
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }
```

---

## 2. ERD — Authentication & Session

```mermaid
erDiagram
    users ||--o{ user_sessions : has
    users ||--o{ refresh_tokens : has
    user_sessions ||--o{ refresh_tokens : linked

    users {
        uuid id PK
        string email
        string passwordHash
        enum status
    }

    user_sessions {
        uuid id PK
        uuid userId FK
        uuid organizationId FK
        string deviceId
        string deviceName
        string deviceType
        string ipAddress
        string userAgent
        string fcmToken
        boolean isActive
        datetime lastActivityAt
        datetime createdAt
        datetime expiresAt
    }

    refresh_tokens {
        uuid id PK
        uuid userId FK
        uuid sessionId FK
        string tokenHash
        boolean isRevoked
        datetime revokedAt
        string replacedByTokenId
        datetime createdAt
        datetime expiresAt
    }
```

---

## 3. ERD — Financial Transactions

```mermaid
erDiagram
    organizations ||--o{ incomes : has
    organizations ||--o{ expenses : has
    branches ||--o{ incomes : branch
    branches ||--o{ expenses : branch
    income_categories ||--o{ incomes : type
    expense_categories ||--o{ expenses : type
    users ||--o{ incomes : createdBy
    users ||--o{ expenses : createdBy

    incomes {
        uuid id PK
        uuid organizationId FK
        uuid branchId FK
        uuid categoryId FK
        decimal amount
        date transactionDate
        string sourceName
        text description
        string attachmentUrl
        decimal latitude
        decimal longitude
        enum syncStatus
        string localId
        uuid createdBy FK
        uuid updatedBy FK
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    expenses {
        uuid id PK
        uuid organizationId FK
        uuid branchId FK
        uuid categoryId FK
        decimal amount
        date transactionDate
        string vendorName
        text description
        string attachmentUrl
        enum status
        decimal latitude
        decimal longitude
        enum syncStatus
        string localId
        uuid createdBy FK
        uuid updatedBy FK
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    income_categories {
        uuid id PK
        uuid organizationId FK
        string name
        string slug
        string icon
        string color
        boolean isDefault
        boolean isActive
        datetime createdAt
    }

    expense_categories {
        uuid id PK
        uuid organizationId FK
        string name
        string slug
        string icon
        string color
        boolean isDefault
        boolean isActive
        datetime createdAt
    }
```

### Default Categories (Seeded per Organization)

**Income**: Penjualan, Jasa, Donasi, Sponsor, Investasi, Hibah, Lainnya

**Expense**: Operasional, Gaji, Marketing, Transportasi, Perjalanan Dinas, Pajak, Aset, Maintenance, Lainnya

---

## 4. ERD — Budget & Financial Target

```mermaid
erDiagram
    organizations ||--o{ budgets : plans
    organizations ||--o{ targets : goals
    expense_categories ||--o{ budgets : category
    budgets ||--o{ budget_histories : audit

    budgets {
        uuid id PK
        uuid organizationId FK
        uuid categoryId FK
        decimal budgetAmount
        decimal usedAmount
        decimal remainingAmount
        enum period
        date startDate
        date endDate
        enum alertLevel
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    budget_histories {
        uuid id PK
        uuid budgetId FK
        uuid organizationId FK
        decimal previousAmount
        decimal newAmount
        decimal previousUsed
        decimal newUsed
        string changeReason
        uuid changedBy FK
        datetime createdAt
    }

    targets {
        uuid id PK
        uuid organizationId FK
        string name
        decimal targetAmount
        decimal currentAmount
        enum period
        date startDate
        date endDate
        enum status
        boolean badgeEarned
        datetime createdAt
        datetime updatedAt
    }
```

### Budget Alert Levels

| Level | Threshold |
|-------|-----------|
| NORMAL | < 80% |
| WARNING_80 | ≥ 80% |
| WARNING_90 | ≥ 90% |
| OVER_BUDGET | > 100% |

---

## 5. ERD — Approval System

```mermaid
erDiagram
    approval_flows ||--o{ approval_histories : logs
    users ||--o{ approval_histories : actor
    incomes ||--o| approval_flows : income
    expenses ||--o| approval_flows : expense

    approval_flows {
        uuid id PK
        uuid organizationId FK
        enum entityType
        uuid entityId
        enum status
        uuid submittedBy FK
        uuid currentApproverId FK
        int approvalLevel
        text rejectionReason
        datetime submittedAt
        datetime completedAt
        datetime createdAt
        datetime updatedAt
    }

    approval_histories {
        uuid id PK
        uuid approvalFlowId FK
        uuid organizationId FK
        uuid actorId FK
        enum action
        enum fromStatus
        enum toStatus
        text comment
        datetime createdAt
    }
```

### Approval Status Enum

`DRAFT` → `PENDING` → `APPROVED` | `REJECTED` | `CANCELLED`

---

## 6. ERD — Audit Trail

```mermaid
erDiagram
    users ||--o{ audit_logs : performs
    organizations ||--o{ audit_logs : scope

    audit_logs {
        uuid id PK
        uuid organizationId FK
        uuid userId FK
        enum action
        string entity
        uuid entityId
        json oldData
        json newData
        string ipAddress
        string userAgent
        decimal latitude
        decimal longitude
        datetime createdAt
    }
```

### Audit Actions

`LOGIN`, `LOGOUT`, `CREATE`, `UPDATE`, `DELETE`, `EXPORT`, `APPROVE`, `REJECT`, `SYNC`, `UPLOAD`

---

## 7. ERD — Notifications

```mermaid
erDiagram
    users ||--o{ notifications : receives
    organizations ||--o{ notifications : scope

    notifications {
        uuid id PK
        uuid organizationId FK
        uuid userId FK
        string title
        text body
        enum type
        enum channel
        enum status
        json metadata
        datetime readAt
        datetime archivedAt
        datetime createdAt
    }
```

### Notification Channels

`IN_APP`, `PUSH`, `EMAIL`

### Notification Status

`UNREAD`, `READ`, `ARCHIVED`

---

## 8. ERD — Attachments & Reports

```mermaid
erDiagram
    organizations ||--o{ attachments : stores
    organizations ||--o{ reports : generates
    users ||--o{ reports : requestedBy

    attachments {
        uuid id PK
        uuid organizationId FK
        enum entityType
        uuid entityId
        string fileName
        string mimeType
        int fileSize
        string r2Key
        string url
        string localPath
        enum uploadStatus
        uuid uploadedBy FK
        datetime createdAt
    }

    reports {
        uuid id PK
        uuid organizationId FK
        enum reportType
        enum period
        date startDate
        date endDate
        enum format
        string fileUrl
        json parameters
        enum status
        uuid generatedBy FK
        datetime createdAt
        datetime completedAt
    }

    sync_logs {
        uuid id PK
        uuid organizationId FK
        uuid userId FK
        string deviceId
        int itemsSynced
        int itemsFailed
        json details
        datetime startedAt
        datetime completedAt
    }
```

---

## 9. ERD — Double-Entry Accounting

```mermaid
erDiagram
    organizations ||--o{ chart_of_accounts : maintains
    organizations ||--o{ journal_entries : posts
    chart_of_accounts ||--o{ journal_details : line
    journal_entries ||--|{ journal_details : contains
    incomes ||--o| journal_entries : auto
    expenses ||--o| journal_entries : auto

    chart_of_accounts {
        uuid id PK
        uuid organizationId FK
        string code UK
        string name
        enum accountType
        uuid parentId FK
        int level
        boolean isActive
        boolean isSystem
        decimal balance
        datetime createdAt
        datetime updatedAt
    }

    journal_entries {
        uuid id PK
        uuid organizationId FK
        string entryNumber UK
        date entryDate
        text description
        enum sourceType
        uuid sourceId
        enum status
        decimal totalDebit
        decimal totalCredit
        uuid createdBy FK
        datetime createdAt
        datetime postedAt
    }

    journal_details {
        uuid id PK
        uuid journalEntryId FK
        uuid organizationId FK
        uuid accountId FK
        decimal debit
        decimal credit
        text description
        datetime createdAt
    }
```

### Account Types

`ASSET`, `LIABILITY`, `EQUITY`, `REVENUE`, `EXPENSE`

### Default Chart of Accounts (Seeded)

| Code | Name | Type |
|------|------|------|
| 1000 | Kas | ASSET |
| 1100 | Bank | ASSET |
| 2000 | Hutang Usaha | LIABILITY |
| 3000 | Modal | EQUITY |
| 4000 | Pendapatan Penjualan | REVENUE |
| 4100 | Pendapatan Jasa | REVENUE |
| 5000 | Beban Operasional | EXPENSE |
| 5100 | Beban Gaji | EXPENSE |

---

## 10. ERD — Complete Relationship Map

```mermaid
erDiagram
    organizations ||--o{ branches : "1:N"
    organizations ||--o{ users : "1:N"
    organizations ||--o{ incomes : "1:N"
    organizations ||--o{ expenses : "1:N"
    organizations ||--o{ budgets : "1:N"
    organizations ||--o{ targets : "1:N"
    organizations ||--o{ notifications : "1:N"
    organizations ||--o{ audit_logs : "1:N"
    organizations ||--o{ reports : "1:N"
    organizations ||--o{ chart_of_accounts : "1:N"
    organizations ||--o{ journal_entries : "1:N"
    organizations ||--o{ approval_flows : "1:N"
    organizations ||--o{ attachments : "1:N"
    organizations ||--o{ sync_logs : "1:N"

    roles ||--o{ users : "1:N"
    roles }o--o{ permissions : "M:N via role_permissions"

    users ||--o{ user_sessions : "1:N"
    users ||--o{ refresh_tokens : "1:N"
    users ||--o{ audit_logs : "1:N"
    users ||--o{ notifications : "1:N"

    incomes }o--|| income_categories : "N:1"
    expenses }o--|| expense_categories : "N:1"
    budgets }o--|| expense_categories : "N:1"

    incomes ||--o| journal_entries : "1:0..1"
    expenses ||--o| journal_entries : "1:0..1"
    journal_entries ||--|{ journal_details : "1:N"
    journal_details }o--|| chart_of_accounts : "N:1"

    approval_flows ||--o{ approval_histories : "1:N"
```

---

## 11. Indexing Strategy

| Table | Index | Purpose |
|-------|-------|---------|
| All transaction tables | `(organizationId)` | Tenant filter |
| incomes, expenses | `(organizationId, transactionDate)` | Date range queries |
| incomes, expenses | `(organizationId, branchId)` | Branch filter |
| incomes, expenses | `(organizationId, categoryId)` | Category analytics |
| audit_logs | `(organizationId, createdAt DESC)` | Audit timeline |
| notifications | `(userId, status)` | Unread count |
| journal_entries | `(organizationId, entryDate)` | GL reports |
| chart_of_accounts | `(organizationId, code)` UNIQUE | Account lookup |
| refresh_tokens | `(tokenHash)` | Token validation |
| user_sessions | `(userId, isActive)` | Session management |

---

## 12. Soft Delete Strategy

Tabel dengan `deletedAt` (soft delete):

- `organizations`
- `users`
- `incomes`
- `expenses`

Tabel tanpa soft delete (immutable / audit):

- `audit_logs`
- `approval_histories`
- `budget_histories`
- `journal_entries` (void via reversing entry, not delete)

---

## 13. Mobile SQLite Schema (Offline Mirror)

Tabel lokal di Expo SQLite (subset server):

| Table | Sync Direction |
|-------|----------------|
| `income` | Bidirectional |
| `expense` | Bidirectional |
| `income_category` | Server → Client |
| `expense_category` | Server → Client |
| `notification` | Server → Client |
| `sync_queue` | Client only |

`sync_queue` tidak ada di PostgreSQL server — hanya client-side.

---

## 14. Data Volume Estimates (10k Active Users)

| Table | Est. Rows/Year | Growth |
|-------|----------------|--------|
| incomes | 2M | Linear per transaction |
| expenses | 3M | Linear per transaction |
| journal_details | 10M | 2x per transaction |
| audit_logs | 5M | Per action |
| notifications | 1M | Per event |

Partitioning recommendation at scale: `audit_logs`, `journal_entries` by `createdAt` (monthly).
