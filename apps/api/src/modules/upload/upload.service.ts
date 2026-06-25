import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.module';
import { R2Service } from './r2.service';
import { TenantContext } from '../../common/interfaces';
import { ConfirmUploadDto, PresignedUrlDto } from './dto/upload.dto';

@Injectable()
export class UploadService {
  constructor(
    private prisma: PrismaService,
    private r2: R2Service,
  ) {}

  async getPresignedUrl(ctx: TenantContext, dto: PresignedUrlDto) {
    this.r2.validateFile(dto.mimeType, dto.fileSize);

    const key = this.r2.buildKey(
      ctx.organizationId,
      dto.entityType.toLowerCase(),
      dto.fileName,
    );

    const attachment = await this.prisma.attachment.create({
      data: {
        organizationId: ctx.organizationId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
        r2Key: key,
        uploadStatus: 'PENDING',
        uploadedBy: ctx.userId,
      },
    });

    if (!this.r2.isEnabled()) {
      return {
        attachmentId: attachment.id,
        uploadUrl: null,
        key,
        publicUrl: null,
        message: 'R2 not configured — use local upload in dev',
        expiresIn: 0,
      };
    }

    const presigned = await this.r2.getPresignedUploadUrl(key, dto.mimeType);

    return {
      attachmentId: attachment.id,
      ...presigned,
    };
  }

  async confirmUpload(ctx: TenantContext, dto: ConfirmUploadDto) {
    const attachment = await this.prisma.attachment.findFirst({
      where: { id: dto.attachmentId, organizationId: ctx.organizationId },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');

    const r2Key = dto.r2Key ?? attachment.r2Key;
    if (!r2Key) throw new BadRequestException('R2 key missing');

    const url = this.r2.getPublicUrl(r2Key);

    const updated = await this.prisma.attachment.update({
      where: { id: attachment.id },
      data: {
        r2Key,
        url,
        uploadStatus: 'COMPLETED',
      },
    });

    await this.linkAttachmentToEntity(updated);

    return updated;
  }

  async deleteAttachment(ctx: TenantContext, attachmentId: string) {
    const attachment = await this.prisma.attachment.findFirst({
      where: { id: attachmentId, organizationId: ctx.organizationId },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');

    if (attachment.r2Key) {
      await this.r2.deleteObject(attachment.r2Key);
    }

    await this.prisma.attachment.delete({ where: { id: attachmentId } });
    return { message: 'Attachment deleted' };
  }

  private async linkAttachmentToEntity(attachment: {
    entityType: string;
    entityId: string;
    url: string | null;
  }) {
    if (!attachment.url) return;

    switch (attachment.entityType) {
      case 'INCOME':
        await this.prisma.income.updateMany({
          where: { id: attachment.entityId },
          data: { attachmentUrl: attachment.url },
        });
        break;
      case 'EXPENSE':
        await this.prisma.expense.updateMany({
          where: { id: attachment.entityId },
          data: { attachmentUrl: attachment.url },
        });
        break;
      case 'USER_AVATAR':
        await this.prisma.user.updateMany({
          where: { id: attachment.entityId },
          data: { avatar: attachment.url },
        });
        break;
      case 'ORGANIZATION_LOGO':
        await this.prisma.organization.updateMany({
          where: { id: attachment.entityId },
          data: { logo: attachment.url },
        });
        break;
    }
  }
}
