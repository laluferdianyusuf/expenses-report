import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addQueuedUpload, removeQueuedUpload } from '@/store/slices/offline.slice';
import { showToast } from '@/store/slices/ui.slice';
import {
  createQueuedUpload,
  uploadAttachment,
} from '@/services/upload/upload.service';
import type { AttachmentEntityType, PickedAttachment } from '@/types/upload.types';
import { getErrorMessage } from '@/services/api/client';

export function useAttachmentUpload() {
  const dispatch = useAppDispatch();
  const orgId = useAppSelector((s) => s.organization.currentOrgId);
  const isOnline = useAppSelector((s) => s.sync.isOnline);

  const uploadOrQueue = useCallback(
    async (
      file: PickedAttachment,
      entityType: AttachmentEntityType,
      entityId: string,
    ): Promise<string | null> => {
      if (!orgId) throw new Error('Organisasi tidak ditemukan');

      const queue = () => {
        dispatch(addQueuedUpload(createQueuedUpload(file, entityType, entityId)));
        dispatch(
          showToast({
            type: 'info',
            message: 'Lampiran disimpan — akan diunggah setelah online/sync',
          }),
        );
      };

      if (!isOnline) {
        queue();
        return null;
      }

      try {
        return await uploadAttachment(orgId, file, entityType, entityId);
      } catch (error) {
        const message = getErrorMessage(error);
        if (message.includes('belum tersinkron') || message.includes('sync')) {
          queue();
          return null;
        }
        throw error;
      }
    },
    [dispatch, isOnline, orgId],
  );

  return { uploadOrQueue, removeQueuedUpload: (id: string) => dispatch(removeQueuedUpload(id)) };
}
