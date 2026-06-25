import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentOrg, CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { JwtPayload, TenantContext } from '../../common/interfaces';
import { buildTenantContext } from '../../common/utils';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  getDashboard(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Query('branchId') branchId?: string,
  ) {
    const ctx: TenantContext = buildTenantContext(user, orgId, branchId);
    return this.dashboardService.getDashboard(ctx, branchId);
  }
}
