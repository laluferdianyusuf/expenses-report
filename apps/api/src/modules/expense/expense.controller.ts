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
import { ExpenseService } from './expense.service';
import { CreateExpenseDto, ExpenseQueryDto, UpdateExpenseDto } from './dto/expense.dto';
import { CurrentOrg, CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators';
import { JwtPayload, TenantContext } from '../../common/interfaces';
import { buildTenantContext } from '../../common/utils';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('expenses')
export class ExpenseController {
  constructor(private expenseService: ExpenseService) {}

  private ctx(user: JwtPayload, orgId: string): TenantContext {
    return buildTenantContext(user, orgId);
  }

  @Get()
  @Permissions('expense:read')
  findAll(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Query() query: ExpenseQueryDto,
  ) {
    return this.expenseService.findAll(this.ctx(user, orgId), query);
  }

  @Get('summary')
  @Permissions('expense:read')
  summary(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.expenseService.summary(this.ctx(user, orgId), startDate, endDate, branchId);
  }

  @Get(':id')
  @Permissions('expense:read')
  findOne(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.expenseService.findOne(this.ctx(user, orgId), id);
  }

  @Post()
  @Permissions('expense:create')
  create(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expenseService.create(this.ctx(user, orgId), dto);
  }

  @Patch(':id')
  @Permissions('expense:update')
  update(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expenseService.update(this.ctx(user, orgId), id, dto);
  }

  @Delete(':id')
  @Permissions('expense:delete')
  remove(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.expenseService.remove(this.ctx(user, orgId), id);
  }
}

@ApiTags('Expense Categories')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('expense-categories')
export class ExpenseCategoryController {
  constructor(private expenseService: ExpenseService) {}

  @Get()
  @Permissions('expense:read')
  findAll(@CurrentOrg() orgId: string) {
    return this.expenseService.listCategories(orgId);
  }
}
