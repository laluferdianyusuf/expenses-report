import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'application/pdf',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class R2Service implements OnModuleInit {
  private readonly logger = new Logger(R2Service.name);
  private client: S3Client | null = null;
  private bucket = '';
  private publicUrl = '';
  private enabled = false;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const accountId = this.config.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucket = this.config.get<string>('R2_BUCKET_NAME', 'fms-attachments');
    this.publicUrl = this.config.get<string>('R2_PUBLIC_URL', '');

    if (accountId && accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
      this.enabled = true;
      this.logger.log('Cloudflare R2 storage enabled');
    } else {
      this.logger.warn('R2 credentials not configured — file storage disabled');
    }
  }

  isEnabled() {
    return this.enabled;
  }

  validateFile(mimeType: string, fileSize: number) {
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new Error('File type not allowed. Use JPG, PNG, or PDF.');
    }
    if (fileSize > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 10MB limit.');
    }
  }

  buildKey(organizationId: string, folder: string, fileName: string) {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    return `orgs/${organizationId}/${folder}/${timestamp}-${safeName}`;
  }

  async getPresignedUploadUrl(key: string, mimeType: string, expiresIn = 900) {
    this.ensureEnabled();
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });
    const uploadUrl = await getSignedUrl(this.client!, command, { expiresIn });
    return {
      uploadUrl,
      key,
      publicUrl: this.getPublicUrl(key),
      expiresIn,
    };
  }

  async getPresignedDownloadUrl(key: string, expiresIn = 3600) {
    this.ensureEnabled();
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client!, command, { expiresIn });
  }

  async uploadBuffer(key: string, buffer: Buffer, mimeType: string) {
    this.ensureEnabled();
    await this.client!.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
    return this.getPublicUrl(key);
  }

  async deleteObject(key: string) {
    if (!this.enabled || !key) return;
    await this.client!.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  getPublicUrl(key: string) {
    if (this.publicUrl) {
      return `${this.publicUrl.replace(/\/$/, '')}/${key}`;
    }
    return key;
  }

  getMimeTypeForFormat(format: string): string {
    switch (format) {
      case 'PDF':
        return 'application/pdf';
      case 'EXCEL':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'CSV':
        return 'text/csv';
      default:
        return 'application/octet-stream';
    }
  }

  private ensureEnabled() {
    if (!this.enabled || !this.client) {
      throw new Error('R2 storage is not configured');
    }
  }
}
