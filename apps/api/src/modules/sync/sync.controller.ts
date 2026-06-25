import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SyncService } from './sync.service';
import { ResolveConflictDto, SyncPullQueryDto, SyncPushDto } from './dto/sync.dto';
import { CurrentOrg, CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { JwtPayload, TenantContext } from '../../common/interfaces';
import { buildTenantContext } from '../../common/utils';

@ApiTags('Sync')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('sync')
export class SyncController {
  constructor(private syncService: SyncService) {}

  private ctx(user: JwtPayload, orgId: string): TenantContext {
    return buildTenantContext(user, orgId);
  }

  @Post('push')
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  push(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Body() dto: SyncPushDto,
  ) {
    return this.syncService.push(this.ctx(user, orgId), dto);
  }

  @Get('pull')
  pull(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Query() query: SyncPullQueryDto,
  ) {
    const entities = query.entities?.split(',').filter(Boolean);
    return this.syncService.pull(
      this.ctx(user, orgId),
      new Date(query.since),
      entities,
    );
  }

  @Get('status')
  status(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Query('deviceId') deviceId: string,
  ) {
    return this.syncService.getStatus(this.ctx(user, orgId), deviceId);
  }

  @Post('resolve-conflict')
  resolveConflict(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Body() dto: ResolveConflictDto,
  ) {
    return this.syncService.resolveConflict(this.ctx(user, orgId), dto);
  }
}
