import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { CurrentOrg } from '../../common/decorators/current-user.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Permissions('audit:read')
  findAll(@CurrentOrg() orgId: string, @Query() query: PaginationDto) {
    return this.auditService.findAll(orgId, query.page, query.limit);
  }
}
