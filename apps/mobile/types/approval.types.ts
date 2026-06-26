export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface ApprovalFlow {
  id: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  status: ApprovalStatus;
  submittedAt?: string;
  resolvedAt?: string | null;
  submitter?: { id: string; name: string };
  expense?: {
    id: string;
    amount: number | string;
    vendorName?: string | null;
    description?: string | null;
    transactionDate: string;
    status: string;
    category?: { id: string; name: string };
    creator?: { name: string };
  };
}
