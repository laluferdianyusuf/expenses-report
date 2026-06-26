import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { uploadApi } from '@/services/api/upload.api';
import { incomeLocalRepo } from '@/features/offline/sqlite/repositories/income.local';
import { expenseLocalRepo } from '@/features/offline/sqlite/repositories/expense.local';
import type { AttachmentEntityType, PickedAttachment } from '@/types/upload.types';
import { generateLocalId } from '@/utils/id';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'application/pdf']);
const MAX_SIZE = 10 * 1024 * 1024;

function normalizeMimeType(mime: string | undefined): PickedAttachment['mimeType'] | null {
  if (mime === 'image/jpg') return 'image/jpeg';
  if (mime && ALLOWED_MIME.has(mime)) return mime as PickedAttachment['mimeType'];
  return null;
}

export async function pickImageFromGallery(): Promise<PickedAttachment | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const mimeType = normalizeMimeType(asset.mimeType ?? 'image/jpeg');
  if (!mimeType) throw new Error('Format file tidak didukung. Gunakan JPG, PNG, atau PDF.');

  const fileSize = asset.fileSize ?? 0;
  if (fileSize > MAX_SIZE) throw new Error('Ukuran file melebihi 10MB.');

  const info = await FileSystem.getInfoAsync(asset.uri);
  const resolvedSize =
    asset.fileSize ?? (info.exists && 'size' in info ? (info.size ?? 0) : 0);

  return {
    uri: asset.uri,
    fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
    mimeType,
    fileSize: resolvedSize,
  };
}

export async function pickDocument(): Promise<PickedAttachment | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['image/jpeg', 'image/png', 'application/pdf'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const mimeType = normalizeMimeType(asset.mimeType ?? undefined);
  if (!mimeType) throw new Error('Format file tidak didukung. Gunakan JPG, PNG, atau PDF.');

  const fileSize = asset.size ?? 0;
  if (fileSize > MAX_SIZE) throw new Error('Ukuran file melebihi 10MB.');

  return {
    uri: asset.uri,
    fileName: asset.name,
    mimeType,
    fileSize,
  };
}

async function resolveServerEntityId(
  orgId: string,
  entityType: AttachmentEntityType,
  entityId: string,
): Promise<string | null> {
  if (!entityId.startsWith('local-')) return entityId;

  const repo = entityType === 'INCOME' ? incomeLocalRepo : expenseLocalRepo;
  const record = await repo.findById(orgId, entityId);
  if (!record) return null;
  if (record.localId) return null;
  return record.id;
}

export async function uploadAttachment(
  orgId: string,
  file: PickedAttachment,
  entityType: AttachmentEntityType,
  entityId: string,
): Promise<string | null> {
  const serverEntityId = await resolveServerEntityId(orgId, entityType, entityId);
  if (!serverEntityId) {
    throw new Error('Transaksi belum tersinkron ke server. Lampiran akan diunggah setelah sync.');
  }

  const presigned = await uploadApi.getPresignedUrl({
    fileName: file.fileName,
    mimeType: file.mimeType,
    fileSize: file.fileSize,
    entityType,
    entityId: serverEntityId,
  });

  if (!presigned.uploadUrl) {
    throw new Error(presigned.message ?? 'Upload storage belum dikonfigurasi di server.');
  }

  const fileResponse = await fetch(file.uri);
  const blob = await fileResponse.blob();
  const uploadResponse = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.mimeType },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload gagal (HTTP ${uploadResponse.status})`);
  }

  await uploadApi.confirm(presigned.attachmentId, presigned.key);
  return presigned.publicUrl;
}

export function createQueuedUpload(
  file: PickedAttachment,
  entityType: AttachmentEntityType,
  entityId: string,
) {
  return {
    id: generateLocalId(),
    uri: file.uri,
    fileName: file.fileName,
    mimeType: file.mimeType,
    fileSize: file.fileSize,
    entityType,
    entityId,
  };
}
