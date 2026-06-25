import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { CurrentOrg, CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators';
import { JwtPayload, TenantContext } from '../../common/interfaces';
import { buildTenantContext } from '../../common/utils';

@ApiTags('Branches')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('branches')
export class BranchesController {
  constructor(private branchesService: BranchesService) {}

  private ctx(user: JwtPayload, orgId: string): TenantContext {
    return buildTenantContext(user, orgId);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @CurrentOrg() orgId: string) {
    return this.branchesService.findAll(this.ctx(user, orgId));
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.branchesService.findOne(this.ctx(user, orgId), id);
  }

  @Post()
  @Permissions('organizations:manage')
  create(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Body() dto: CreateBranchDto,
  ) {
    return this.branchesService.create(this.ctx(user, orgId), dto);
  }

  @Patch(':id')
  @Permissions('organizations:manage')
  update(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchesService.update(this.ctx(user, orgId), id, dto);
  }

  @Delete(':id')
  @Permissions('organizations:manage')
  remove(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.branchesService.remove(this.ctx(user, orgId), id);
  }
}
