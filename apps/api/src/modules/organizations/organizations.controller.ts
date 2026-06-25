import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/organization.dto';
import { CurrentOrg } from '../../common/decorators/current-user.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private orgService: OrganizationsService) {}

  @Get('current')
  getCurrent(@CurrentOrg() orgId: string) {
    return this.orgService.getCurrent(orgId);
  }

  @Patch('current')
  @Permissions('organizations:manage')
  update(@CurrentOrg() orgId: string, @Body() dto: UpdateOrganizationDto) {
    return this.orgService.update(orgId, dto);
  }
}
