import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApprovalService } from './approval.service';
import { ApproveRejectDto, ApprovalQueryDto, SubmitApprovalDto } from './dto/approval.dto';
import { CurrentOrg, CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators';
import { JwtPayload, TenantContext } from '../../common/interfaces';
import { buildTenantContext } from '../../common/utils';

@ApiTags('Approvals')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('approvals')
export class ApprovalController {
  constructor(private approvalService: ApprovalService) {}

  private ctx(user: JwtPayload, orgId: string): TenantContext {
    return buildTenantContext(user, orgId);
  }

  @Get()
  @Permissions('expense:read')
  findAll(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Query() query: ApprovalQueryDto,
  ) {
    return this.approvalService.findAll(this.ctx(user, orgId), query.page, query.limit);
  }

  @Get('pending')
  @Permissions('approval:approve')
  findPending(@CurrentUser() user: JwtPayload, @CurrentOrg() orgId: string) {
    return this.approvalService.findPending(this.ctx(user, orgId));
  }

  @Get(':id')
  @Permissions('expense:read')
  findOne(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.approvalService.findOne(this.ctx(user, orgId), id);
  }

  @Post('submit')
  @Permissions('expense:create')
  submit(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Body() dto: SubmitApprovalDto,
  ) {
    return this.approvalService.submit(this.ctx(user, orgId), dto);
  }

  @Post(':id/approve')
  @Permissions('approval:approve')
  approve(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() dto: ApproveRejectDto,
  ) {
    return this.approvalService.approve(this.ctx(user, orgId), id, dto);
  }

  @Post(':id/reject')
  @Permissions('approval:reject')
  reject(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() dto: ApproveRejectDto,
  ) {
    return this.approvalService.reject(this.ctx(user, orgId), id, dto);
  }

  @Post(':id/cancel')
  @Permissions('expense:create')
  cancel(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.approvalService.cancel(this.ctx(user, orgId), id);
  }
}
