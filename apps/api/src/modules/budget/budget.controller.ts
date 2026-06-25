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
import { BudgetService } from './budget.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';
import { CurrentOrg, CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators';
import { JwtPayload, TenantContext } from '../../common/interfaces';
import { buildTenantContext } from '../../common/utils';

@ApiTags('Budgets')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('budgets')
export class BudgetController {
  constructor(private budgetService: BudgetService) {}

  private ctx(user: JwtPayload, orgId: string): TenantContext {
    return buildTenantContext(user, orgId);
  }

  @Get()
  @Permissions('budget:manage')
  findAll(@CurrentUser() user: JwtPayload, @CurrentOrg() orgId: string) {
    return this.budgetService.findAll(this.ctx(user, orgId));
  }

  @Get('monitoring')
  @Permissions('analytics:read')
  monitoring(@CurrentUser() user: JwtPayload, @CurrentOrg() orgId: string) {
    return this.budgetService.monitoring(this.ctx(user, orgId));
  }

  @Get(':id')
  @Permissions('budget:manage')
  findOne(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.budgetService.findOne(this.ctx(user, orgId), id);
  }

  @Post()
  @Permissions('budget:manage')
  create(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Body() dto: CreateBudgetDto,
  ) {
    return this.budgetService.create(this.ctx(user, orgId), dto);
  }

  @Patch(':id')
  @Permissions('budget:manage')
  update(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgetService.update(this.ctx(user, orgId), id, dto);
  }

  @Delete(':id')
  @Permissions('budget:manage')
  remove(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.budgetService.remove(this.ctx(user, orgId), id);
  }
}
