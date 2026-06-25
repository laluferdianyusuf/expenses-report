# FMS Enterprise — Documentation Index

> Financial Management System | Architecture & Specification

---

## Phase 1 — Foundation

| Doc | Title | Status |
|-----|-------|--------|
| [01-system-architecture.md](./01-system-architecture.md) | System Architecture Diagram | ✅ |
| [02-database-erd.md](./02-database-erd.md) | Database ERD Lengkap | ✅ |
| [../prisma/schema.prisma](../prisma/schema.prisma) | Prisma Schema Lengkap | ✅ |

## Phase 2 — Specification

| Doc | Title | Status |
|-----|-------|--------|
| [03-folder-structure.md](./03-folder-structure.md) | Folder Structure (Backend + Mobile) | ✅ |
| [04-rest-api-endpoints.md](./04-rest-api-endpoints.md) | REST API Endpoints (~116) | ✅ |
| [05-nestjs-backend-spec.md](./05-nestjs-backend-spec.md) | NestJS Modules, DTO, Repository | ✅ |
| [06-business-flows.md](./06-business-flows.md) | Auth, Approval, Notification, Sync, Accounting | ✅ |
| [07-mobile-frontend-spec.md](./07-mobile-frontend-spec.md) | Redux, React Query, Router, Screens, Dashboard | ✅ |
| [08-security-deployment.md](./08-security-deployment.md) | Security & Deployment Architecture | ✅ |

## Phase 3 — Implementation

| Component | Status |
|-----------|--------|
| Backend scaffold (`apps/api`) | ✅ |
| Auth, Users, Org, Branch | ✅ |
| Income, Expense, Approval | ✅ |
| Budget, Dashboard, Notifications | ✅ |
| Accounting (auto journal) | ✅ |
| Sync, Analytics, Jobs (BullMQ) | ✅ |
| Reports, R2 Upload, FCM Push | ✅ |
| Mobile (`apps/mobile`) | ⏳ Next |

See [09-backend-setup.md](./09-backend-setup.md) for run instructions.
