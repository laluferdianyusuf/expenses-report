import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IncomeService } from './income.service';
import { CreateIncomeDto, IncomeQueryDto, UpdateIncomeDto } from './dto/income.dto';
import { CurrentOrg, CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators';
import { JwtPayload, TenantContext } from '../../common/interfaces';
import { buildTenantContext } from '../../common/utils';

@ApiTags('Incomes')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('incomes')
export class IncomeController {
  constructor(private incomeService: IncomeService) {}

  private ctx(user: JwtPayload, orgId: string): TenantContext {
    return buildTenantContext(user, orgId);
  }

  @Get()
  @Permissions('income:read')
  findAll(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Query() query: IncomeQueryDto,
  ) {
    return this.incomeService.findAll(this.ctx(user, orgId), query);
  }

  @Get('summary')
  @Permissions('income:read')
  summary(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.incomeService.summary(
      this.ctx(user, orgId),
      startDate,
      endDate,
      branchId,
    );
  }

  @Get(':id')
  @Permissions('income:read')
  findOne(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.incomeService.findOne(this.ctx(user, orgId), id);
  }

  @Post()
  @Permissions('income:create')
  create(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Body() dto: CreateIncomeDto,
  ) {
    return this.incomeService.create(this.ctx(user, orgId), dto);
  }

  @Patch(':id')
  @Permissions('income:update')
  update(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateIncomeDto,
  ) {
    return this.incomeService.update(this.ctx(user, orgId), id, dto);
  }

  @Delete(':id')
  @Permissions('income:delete')
  remove(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.incomeService.remove(this.ctx(user, orgId), id);
  }
}

@ApiTags('Income Categories')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('income-categories')
export class IncomeCategoryController {
  constructor(private incomeService: IncomeService) {}

  @Get()
  @Permissions('income:read')
  findAll(@CurrentOrg() orgId: string) {
    return this.incomeService.listCategories(orgId);
  }
}
