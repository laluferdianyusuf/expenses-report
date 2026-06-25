import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UploadService } from './upload.service';
import { ConfirmUploadDto, PresignedUrlDto } from './dto/upload.dto';
import { CurrentOrg, CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { JwtPayload, TenantContext } from '../../common/interfaces';
import { buildTenantContext } from '../../common/utils';

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  private ctx(user: JwtPayload, orgId: string): TenantContext {
    return buildTenantContext(user, orgId);
  }

  @Post('presigned-url')
  @Throttle({ default: { ttl: 3600000, limit: 20 } })
  presignedUrl(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Body() dto: PresignedUrlDto,
  ) {
    return this.uploadService.getPresignedUrl(this.ctx(user, orgId), dto);
  }

  @Post('confirm')
  confirm(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Body() dto: ConfirmUploadDto,
  ) {
    return this.uploadService.confirmUpload(this.ctx(user, orgId), dto);
  }

  @Delete(':attachmentId')
  remove(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.uploadService.deleteAttachment(this.ctx(user, orgId), attachmentId);
  }
}
