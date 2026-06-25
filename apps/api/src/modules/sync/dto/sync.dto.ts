import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SyncEntityType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum SyncAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export class SyncItemDto {
  @ApiProperty({ enum: SyncEntityType })
  @IsEnum(SyncEntityType)
  entityType!: SyncEntityType;

  @ApiProperty({ description: 'Client-side entity ID (localId)' })
  @IsString()
  entityId!: string;

  @ApiProperty({ enum: SyncAction })
  @IsEnum(SyncAction)
  action!: SyncAction;

  @ApiProperty()
  @IsObject()
  payload!: Record<string, unknown>;

  @ApiProperty()
  @IsDateString()
  clientTimestamp!: string;
}

export class SyncPushDto {
  @ApiProperty()
  @IsString()
  deviceId!: string;

  @ApiProperty({ type: [SyncItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncItemDto)
  items!: SyncItemDto[];
}

export class SyncPullQueryDto {
  @ApiProperty()
  @IsDateString()
  since!: string;

  @ApiPropertyOptional({ description: 'Comma-separated: income,expense,notification,categories' })
  @IsOptional()
  @IsString()
  entities?: string;
}

export class ResolveConflictDto {
  @ApiProperty({ enum: SyncEntityType })
  @IsEnum(SyncEntityType)
  entityType!: SyncEntityType;

  @ApiProperty()
  @IsString()
  entityId!: string;

  @ApiProperty({ enum: ['CLIENT', 'SERVER'] })
  @IsEnum(['CLIENT', 'SERVER'])
  resolution!: 'CLIENT' | 'SERVER';

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  clientPayload?: Record<string, unknown>;
}
