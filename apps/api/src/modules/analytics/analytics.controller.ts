import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics.dto';
import { CurrentOrg, CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators';
import { JwtPayload, TenantContext } from '../../common/interfaces';
import { buildTenantContext } from '../../common/utils';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  private ctx(user: JwtPayload, orgId: string, branchId?: string): TenantContext {
    return buildTenantContext(user, orgId, branchId);
  }

  @Get('overview')
  @Permissions('analytics:read')
  overview(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getOverview(this.ctx(user, orgId, query.branchId), query);
  }

  @Get('income-trend')
  @Permissions('analytics:read')
  incomeTrend(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getIncomeTrend(this.ctx(user, orgId, query.branchId), query);
  }

  @Get('expense-trend')
  @Permissions('analytics:read')
  expenseTrend(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getExpenseTrend(this.ctx(user, orgId, query.branchId), query);
  }

  @Get('cashflow-trend')
  @Permissions('analytics:read')
  cashflowTrend(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getCashflowTrend(this.ctx(user, orgId, query.branchId), query);
  }

  @Get('top-categories')
  @Permissions('analytics:read')
  topCategories(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getTopCategories(this.ctx(user, orgId, query.branchId), query);
  }

  @Get('monthly-comparison')
  @Permissions('analytics:read')
  monthlyComparison(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.analyticsService.getMonthlyComparison(
      this.ctx(user, orgId, branchId),
      branchId,
    );
  }

  @Get('growth-rate')
  @Permissions('analytics:read')
  growthRate(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getGrowthRate(this.ctx(user, orgId, query.branchId), query);
  }

  @Get('health-score')
  @Permissions('analytics:read')
  healthScore(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getHealthScore(this.ctx(user, orgId, query.branchId), query);
  }
}
