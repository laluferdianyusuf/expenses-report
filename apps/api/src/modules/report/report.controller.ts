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
import { Throttle } from '@nestjs/throttler';
import { ReportService } from './report.service';
import { GenerateReportDto } from './dto/report.dto';
import { CurrentOrg, CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators';
import { JwtPayload, TenantContext } from '../../common/interfaces';
import { buildTenantContext } from '../../common/utils';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('reports')
export class ReportController {
  constructor(private reportService: ReportService) {}

  private ctx(user: JwtPayload, orgId: string): TenantContext {
    return buildTenantContext(user, orgId);
  }

  @Get()
  @Permissions('reports:read')
  findAll(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Query() query: PaginationDto,
  ) {
    return this.reportService.findAll(this.ctx(user, orgId), query);
  }

  @Get(':id')
  @Permissions('reports:read')
  findOne(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.reportService.findOne(this.ctx(user, orgId), id);
  }

  @Post('generate')
  @Permissions('reports:export')
  @Throttle({ default: { ttl: 3600000, limit: 10 } })
  generate(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Body() dto: GenerateReportDto,
  ) {
    return this.reportService.requestGenerate(this.ctx(user, orgId), dto);
  }

  @Get(':id/download')
  @Permissions('reports:read')
  download(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.reportService.getDownloadUrl(this.ctx(user, orgId), id);
  }
}
