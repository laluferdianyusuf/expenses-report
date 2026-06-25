import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApprovalEntityType } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class SubmitApprovalDto {
  @ApiProperty({ enum: ApprovalEntityType })
  @IsEnum(ApprovalEntityType)
  entityType!: ApprovalEntityType;

  @ApiProperty()
  @IsUUID()
  entityId!: string;
}

export class ApproveRejectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

export class ApprovalQueryDto extends PaginationDto {}
