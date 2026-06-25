# FMS Enterprise — Business Flows

> Authentication | Approval | Notification | Offline Sync | Accounting

---

## 1. Authentication Flow

### 1.1 Registration Flow

```mermaid
sequenceDiagram
    participant App as Mobile App
    participant API as Auth API
    participant DB as PostgreSQL
    participant Seed as Seed Service

    App->>API: POST /auth/register
    API->>API: Validate DTO (Zod/class-validator)
    API->>DB: Check email unique
    API->>API: Hash password (Argon2)
    API->>DB: BEGIN TRANSACTION
    API->>DB: Create Organization
    API->>Seed: seedOrganizationDefaults(orgId)
    Note over Seed: Income/Expense categories + COA
    API->>DB: Create User (role: OWNER)
    API->>DB: Create UserSession
    API->>DB: Create RefreshToken (hashed)
    API->>DB: COMMIT
    API->>API: Generate JWT access + refresh
    API-->>App: 201 { user, organization, tokens }
    App->>App: SecureStore.set(accessToken, refreshToken, deviceId)
    App->>App: Navigate → Dashboard
```

### 1.2 Login Flow

```mermaid
sequenceDiagram
    participant App as Mobile App
    participant Bio as Local Authentication
    participant API as Auth API
    participant DB as PostgreSQL

    alt Biometric enabled & tokens exist
        App->>Bio: authenticateAsync()
        Bio-->>App: Success
        App->>App: Load tokens from SecureStore
        App->>API: GET /auth/me (access token)
        alt Token expired
            App->>API: POST /auth/refresh
            API->>DB: Validate + rotate refresh token
            API-->>App: New token pair
        end
    else Standard login
        App->>API: POST /auth/login
        API->>DB: Find user by email
        API->>API: Argon2.verify(password)
        API->>DB: Create/update session
        API-->>App: tokens + user profile
        App->>App: Store in SecureStore
    end
    App->>App: Redux: setAuth(user, org)
    App->>App: TanStack Query: prefetch dashboard
```

### 1.3 Refresh Token Rotation

```mermaid
sequenceDiagram
    participant App as Mobile App
    participant API as Auth API
    participant DB as PostgreSQL

    App->>API: POST /auth/refresh { refreshToken }
    API->>DB: Find token by hash
    alt Token revoked or expired
        API-->>App: 401 → Force re-login
    else Valid token
        API->>DB: Mark old token revoked
        API->>DB: Create new refresh token
        API->>DB: Link replacedByTokenId
        API-->>App: New access + refresh tokens
        App->>App: Update SecureStore
    end
```

### 1.4 Session & Device Management

| Action | Endpoint | Effect |
|--------|----------|--------|
| View devices | GET `/auth/sessions` | List active sessions |
| Revoke device | DELETE `/auth/sessions/:id` | Revoke refresh tokens for session |
| Logout | POST `/auth/logout` | Revoke current session only |
| Logout all | POST `/auth/logout-all` | Revoke all user sessions |

### 1.5 Forgot / Reset Password

```
User → POST /auth/forgot-password { email }
  → Generate PasswordResetToken (1 hour expiry)
  → Send email with reset link (optional) OR return token in dev
User → POST /auth/reset-password { token, newPassword }
  → Validate token, hash new password
  → Revoke ALL refresh tokens (force re-login)
```

---

## 2. Approval Flow

### 2.1 State Machine

```mermaid
stateDiagram-v2
    [*] --> DRAFT: STAFF creates expense
    DRAFT --> PENDING: STAFF submits
    PENDING --> APPROVED: FINANCE/OWNER approves
    PENDING --> REJECTED: FINANCE/OWNER rejects
    PENDING --> CANCELLED: Creator cancels
    REJECTED --> DRAFT: STAFF edits & resubmits
    APPROVED --> [*]: Journal + Budget updated
    CANCELLED --> [*]
```

### 2.2 Detailed Sequence

```mermaid
sequenceDiagram
    participant Staff as STAFF
    participant API as Approval API
    participant DB as PostgreSQL
    participant Acct as AccountingService
    participant Budget as BudgetService
    participant Notif as NotificationService
    participant Finance as FINANCE/OWNER

    Staff->>API: POST /expenses (status: DRAFT)
    API->>DB: Create expense + approval_flow (DRAFT)
    Staff->>API: POST /approvals/submit
    API->>DB: Update status → PENDING
    API->>DB: Create approval_history (SUBMIT)
    API->>Notif: Notify FINANCE/OWNER
    Notif->>DB: Create notification (IN_APP + PUSH)

    Finance->>API: POST /approvals/:id/approve
    API->>DB: Update status → APPROVED
    API->>DB: Create approval_history (APPROVE)
    API->>Acct: createJournalFromExpense()
    Acct->>DB: Create journal_entry + details
    Acct->>DB: Update chart_of_accounts balances
    API->>Budget: recalculateUsedAmount()
    Budget->>DB: Update budget used/remaining/alertLevel
    alt Budget >= 80%
        API->>Notif: Budget warning notification
    end
    API->>Notif: Notify STAFF (approved)
    API-->>Finance: 200 OK
```

### 2.3 Approval Level Matrix

| Role | Create | Submit | Approve | Reject | View History |
|------|--------|--------|---------|--------|--------------|
| STAFF | ✅ | ✅ | ❌ | ❌ | Own only |
| FINANCE | ✅ | ✅ | ✅ | ✅ | All |
| OWNER | ✅ | ✅ | ✅ | ✅ | All |
| AUDITOR | ❌ | ❌ | ❌ | ❌ | All (read) |

### 2.4 Income vs Expense Approval

| Entity | Approval Required | Default Status |
|--------|-------------------|----------------|
| Income | Optional (org setting) | APPROVED immediately |
| Expense | **Required** | DRAFT → workflow |

---

## 3. Notification Flow

### 3.1 Event-Driven Architecture

```mermaid
flowchart LR
    EVENT["Domain Event"]
    NS["NotificationService.create()"]
    DB["notifications table"]
    QUEUE["BullMQ: notifications queue"]
    FCM["FCM Service"]
    PUSH["Push to Device"]
    INAPP["In-App Badge Update"]

    EVENT --> NS --> DB
    NS --> QUEUE --> FCM --> PUSH
    DB --> INAPP
```

### 3.2 Notification Triggers

| Event | Type | Recipients | Channels |
|-------|------|------------|----------|
| Expense submitted | `APPROVAL_REQUEST` | FINANCE, OWNER | IN_APP, PUSH |
| Expense approved | `APPROVAL_RESULT` | STAFF (creator) | IN_APP, PUSH |
| Expense rejected | `APPROVAL_RESULT` | STAFF (creator) | IN_APP, PUSH |
| Budget 80% | `BUDGET_WARNING` | FINANCE, OWNER | IN_APP, PUSH |
| Budget 90% | `BUDGET_WARNING` | FINANCE, OWNER | IN_APP, PUSH |
| Over budget | `BUDGET_OVER` | FINANCE, OWNER | IN_APP, PUSH |
| Target achieved | `TARGET_ACHIEVED` | All org users | IN_APP, PUSH |
| No transaction today | `TRANSACTION_REMINDER` | STAFF, FINANCE | IN_APP, PUSH |
| Monthly report due | `REPORT_REMINDER` | OWNER, FINANCE | IN_APP, PUSH |

### 3.3 Cron Reminder Flow

```mermaid
sequenceDiagram
    participant Cron as BullMQ Scheduler
    participant Worker as ReminderProcessor
    participant DB as PostgreSQL
    participant NS as NotificationService
    participant FCM as FCM

    Cron->>Worker: Trigger daily 20:00
    Worker->>DB: Find orgs with no transaction today
    loop Each user (STAFF, FINANCE)
        Worker->>NS: create(TRANSACTION_REMINDER)
        NS->>DB: Insert notification
        NS->>FCM: Send push if fcmToken exists
    end
```

### 3.4 In-App Notification Lifecycle

```
UNREAD → (user opens) → READ → (user archives) → ARCHIVED
```

Mobile polls: `GET /notifications/unread-count` on app foreground.
TanStack Query invalidates on push notification received.

---

## 4. Offline Sync Flow

### 4.1 Architecture Overview

```mermaid
flowchart TB
    subgraph CLIENT["Mobile Client"]
        ACTION["User Action"]
        SQLITE["SQLite Write"]
        QUEUE["sync_queue (PENDING)"]
        UI["Optimistic UI Update"]
        ENGINE["Sync Engine"]
    end

    subgraph SERVER["Backend"]
        PUSH_API["POST /sync/push"]
        PULL_API["GET /sync/pull"]
        DB["PostgreSQL"]
    end

    ACTION --> SQLITE --> QUEUE --> UI
    ENGINE -->|"Online"| PUSH_API --> DB
    ENGINE --> PULL_API --> DB
    ENGINE -->|"Success"| QUEUE_CLEAN["Mark SUCCESS / Delete"]
    ENGINE -->|"Fail"| RETRY["retryCount++ / FAILED"]
```

### 4.2 Offline Create Flow

```
1. User creates income offline
2. Generate localId (UUID)
3. INSERT into SQLite income table
4. INSERT into sync_queue:
   { entityType: 'INCOME', entityId: localId, action: 'CREATE', status: 'PENDING', payload: {...} }
5. Redux: add to offline slice
6. UI shows transaction immediately (with "pending sync" badge)
```

### 4.3 Online Sync Flow

```mermaid
sequenceDiagram
    participant Engine as Sync Engine
    participant Queue as sync_queue (SQLite)
    participant API as POST /sync/push
    participant DB as PostgreSQL
    participant Pull as GET /sync/pull

    Engine->>Engine: Network.isConnected() === true
    Engine->>Queue: SELECT * WHERE status=PENDING ORDER BY createdAt ASC LIMIT 50
    loop Each queue item
        Engine->>Queue: UPDATE status=SYNCING
        Engine->>API: Push batch
        API->>DB: Process CREATE/UPDATE/DELETE
        alt Success
            API-->>Engine: { synced: [{ localId, serverId }] }
            Engine->>Queue: DELETE item (SUCCESS)
            Engine->>Engine: Update SQLite with serverId
        alt Fail (retryable)
            API-->>Engine: 409/500
            Engine->>Queue: retryCount++, status=FAILED or PENDING
        end
    end
    Engine->>Pull: GET /sync/pull?since=lastSyncAt
    Pull-->>Engine: Server changes
    Engine->>Engine: Merge into SQLite + invalidate queries
```

### 4.4 File Upload Offline

```
Offline:
  1. Save file to FileSystem.documentDirectory
  2. Store localPath in attachment record
  3. Queue UPLOAD action in sync_queue

Online:
  1. Sync engine detects UPLOAD action
  2. POST /upload/presigned-url
  3. PUT file to R2 presigned URL
  4. POST /upload/confirm
  5. Update entity attachmentUrl with server URL
  6. Delete local file
```

### 4.5 Conflict Resolution Rules

| Scenario | Resolution |
|----------|------------|
| Same record edited offline & server | Last-Write-Wins (compare `updatedAt`) |
| Delete on server, edit offline | Server wins (notify user) |
| Approval status conflict | Server authority always wins |
| Duplicate localId push | Idempotent — return existing server record |
| Budget amounts | Server recalculates from approved expenses |

### 4.6 Sync Queue Schema (SQLite — Mobile Only)

```sql
CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('CREATE','UPDATE','DELETE','UPLOAD')),
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING','SYNCING','SUCCESS','FAILED')),
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

## 5. Accounting Flow

### 5.1 Double-Entry Principle

```
Every transaction: Total DEBIT = Total CREDIT
```

### 5.2 Income → Journal Entry Flow

```mermaid
sequenceDiagram
    participant API as Income API
    participant Acct as AccountingService
    participant DB as PostgreSQL

    API->>DB: Create Income (amount: 1,500,000)
    API->>Acct: createJournalFromIncome(income)
    Acct->>DB: Get category slug → account mapping
    Note over Acct: penjualan → Debit: Kas(1000), Credit: Pendapatan(4000)
    Acct->>DB: Create JournalEntry (POSTED)
    Acct->>DB: Create JournalDetail (Debit: Kas 1,500,000)
    Acct->>DB: Create JournalDetail (Credit: Pendapatan 1,500,000)
    Acct->>DB: Update ChartOfAccount balances
    Note over DB: Kas += 1,500,000, Pendapatan += 1,500,000
```

### 5.3 Expense → Journal Entry Flow (On Approval Only)

```mermaid
sequenceDiagram
    participant Approval as Approval API
    participant Acct as AccountingService
    participant DB as PostgreSQL

    Approval->>DB: Expense status → APPROVED
    Approval->>Acct: createJournalFromExpense(expense)
    Acct->>DB: Get category slug → account mapping
    Note over Acct: gaji → Debit: Beban Gaji(5100), Credit: Kas(1000)
    Acct->>DB: Create JournalEntry (POSTED)
    Acct->>DB: JournalDetails (balanced)
    Acct->>DB: Update balances
    Note over DB: Beban Gaji += amount, Kas -= amount
```

### 5.4 Manual Journal Entry Flow

```
FINANCE → POST /accounting/journal-entries
  → Validate: sum(debit) === sum(credit)
  → Create JournalEntry (DRAFT)
  → POST /accounting/journal-entries/:id/post
  → Status: POSTED, update account balances
```

### 5.5 Void Journal Entry

```
POST /accounting/journal-entries/:id/void
  → Create reversing entry (swap debit/credit)
  → Original entry status → VOIDED
  → Account balances restored
```

### 5.6 Financial Reports Generation

```mermaid
flowchart TB
    GL["General Ledger<br/>(journal_details)"]
    TB["Trial Balance<br/>Σ debit = Σ credit per account"]
    BS["Balance Sheet<br/>ASSET = LIABILITY + EQUITY"]
    PL["Profit & Loss<br/>REVENUE - EXPENSE = Net Income"]
    CF["Cash Flow Statement<br/>Operating + Investing + Financing"]

    GL --> TB
    TB --> BS
    TB --> PL
    GL --> CF
```

#### Trial Balance Formula

```
For each account: Balance = Σ(debit) - Σ(credit) [for ASSET/EXPENSE]
                  Balance = Σ(credit) - Σ(debit) [for LIABILITY/EQUITY/REVENUE]
```

#### Balance Sheet

```
ASSETS = LIABILITIES + EQUITY
(EQUITY includes retained earnings from P&L)
```

#### Profit & Loss

```
Net Income = Total REVENUE - Total EXPENSE
Period: startDate → endDate
```

### 5.7 Account Balance Update Logic

```typescript
// Pseudocode
function updateBalances(details: JournalDetail[]) {
  for (const detail of details) {
    const account = getAccount(detail.accountId);
    if (['ASSET', 'EXPENSE'].includes(account.accountType)) {
      account.balance += detail.debit - detail.credit;
    } else {
      account.balance += detail.credit - detail.debit;
    }
    save(account);
  }
}
```

---

## 6. Cross-Flow Integration Map

```mermaid
flowchart LR
    AUTH["Auth Flow"] --> DASH["Dashboard"]
    INCOME["Income Create"] --> ACCT["Accounting Journal"]
    EXPENSE["Expense Create"] --> APPROVAL["Approval Flow"]
    APPROVAL -->|"Approved"| ACCT
    APPROVAL --> BUDGET["Budget Update"]
    BUDGET --> NOTIF["Notification"]
    ACCT --> REPORT["Financial Reports"]
    OFFLINE["Offline Sync"] --> INCOME
    OFFLINE --> EXPENSE
    CRON["Cron Jobs"] --> NOTIF
```
