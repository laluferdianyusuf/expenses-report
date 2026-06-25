import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  IsIn,
} from 'class-validator';
import { AttachmentEntityType } from '@prisma/client';

export class PresignedUrlDto {
  @ApiProperty()
  @IsString()
  fileName!: string;

  @ApiProperty({ enum: ['image/jpeg', 'image/png', 'application/pdf'] })
  @IsIn(['image/jpeg', 'image/png', 'application/pdf'])
  mimeType!: string;

  @ApiProperty()
  @IsInt()
  @Max(10485760)
  fileSize!: number;

  @ApiProperty({ enum: AttachmentEntityType })
  @IsEnum(AttachmentEntityType)
  entityType!: AttachmentEntityType;

  @ApiProperty()
  @IsUUID()
  entityId!: string;
}

export class ConfirmUploadDto {
  @ApiProperty()
  @IsUUID()
  attachmentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  r2Key?: string;
}
