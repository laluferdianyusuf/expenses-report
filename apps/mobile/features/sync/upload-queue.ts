import { ReactNode } from 'react';
import { store } from '@/store/store';
import { removeQueuedUpload } from '@/store/slices/offline.slice';
import { uploadAttachment } from '@/services/upload/upload.service';
import type { QueuedAttachmentUpload } from '@/types/upload.types';

export async function processUploadQueue(orgId: string): Promise<number> {
  const uploads = store.getState().offline.queuedUploads as QueuedAttachmentUpload[];
  let uploaded = 0;

  for (const item of uploads) {
    try {
      await uploadAttachment(
        orgId,
        {
          uri: item.uri,
          fileName: item.fileName,
          mimeType: item.mimeType,
          fileSize: item.fileSize,
        },
        item.entityType,
        item.entityId,
      );
      store.dispatch(removeQueuedUpload(item.id));
      uploaded++;
    } catch {
      // Keep in queue — entity may not be synced yet or R2 unavailable
    }
  }

  return uploaded;
}
