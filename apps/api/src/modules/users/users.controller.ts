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
import { UsersService } from './users.service';
import { CreateUserDto, UpdateProfileDto, UpdateUserDto } from './dto/user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Permissions } from '../../common/decorators';
import { CurrentOrg, CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtPayload, TenantContext } from '../../common/interfaces';
import { buildTenantContext } from '../../common/utils';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  private ctx(user: JwtPayload, orgId: string): TenantContext {
    return buildTenantContext(user, orgId);
  }

  @Get()
  @Permissions('users:read')
  findAll(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Query() query: PaginationDto,
  ) {
    return this.usersService.findAll(this.ctx(user, orgId), query);
  }

  @Get(':id')
  @Permissions('users:read')
  findOne(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.usersService.findOne(this.ctx(user, orgId), id);
  }

  @Post()
  @Permissions('users:create')
  create(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.create(this.ctx(user, orgId), dto);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Patch(':id')
  @Permissions('users:update')
  update(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(this.ctx(user, orgId), id, dto);
  }

  @Delete(':id')
  @Permissions('users:delete')
  remove(
    @CurrentUser() user: JwtPayload,
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.usersService.remove(this.ctx(user, orgId), id);
  }
}
