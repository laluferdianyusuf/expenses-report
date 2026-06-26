import { api, unwrap } from './client';
import type { ApiResponse } from '@/types/api.types';
import type { AttachmentEntityType, PresignedUploadResponse } from '@/types/upload.types';

export const uploadApi = {
  getPresignedUrl: async (input: {
    fileName: string;
    mimeType: string;
    fileSize: number;
    entityType: AttachmentEntityType;
    entityId: string;
  }) => {
    const { data } = await api.post<ApiResponse<PresignedUploadResponse>>(
      '/upload/presigned-url',
      input,
    );
    return unwrap(data);
  },

  confirm: async (attachmentId: string, r2Key?: string) => {
    const { data } = await api.post<ApiResponse<unknown>>('/upload/confirm', {
      attachmentId,
      r2Key,
    });
    return unwrap(data);
  },

  remove: async (attachmentId: string) => {
    const { data } = await api.delete<ApiResponse<{ message: string }>>(
      `/upload/${attachmentId}`,
    );
    return unwrap(data);
  },
};
