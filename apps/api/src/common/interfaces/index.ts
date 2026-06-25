export interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string | null;
  roleId: string;
  roleSlug: string;
  permissions: string[];
  sessionId: string;
}

export interface TenantContext {
  organizationId: string;
  userId: string;
  branchId?: string;
  permissions: string[];
  roleSlug: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
