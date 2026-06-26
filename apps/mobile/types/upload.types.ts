export type AttachmentEntityType = 'INCOME' | 'EXPENSE';

export interface PickedAttachment {
  uri: string;
  fileName: string;
  mimeType: 'image/jpeg' | 'image/png' | 'application/pdf';
  fileSize: number;
}

export interface PresignedUploadResponse {
  attachmentId: string;
  uploadUrl: string | null;
  key: string;
  publicUrl: string | null;
  message?: string;
  expiresIn: number;
}

export interface QueuedAttachmentUpload {
  id: string;
  uri: string;
  fileName: string;
  mimeType: PickedAttachment['mimeType'];
  fileSize: number;
  entityType: AttachmentEntityType;
  entityId: string;
}
