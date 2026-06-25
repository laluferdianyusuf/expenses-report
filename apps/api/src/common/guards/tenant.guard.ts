import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SKIP_TENANT_KEY } from '../decorators';
import { JwtPayload } from '../interfaces';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skipTenant = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipTenant) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user) return false;

    if (user.roleSlug === 'super_admin') {
      const headerOrgId = request.headers['x-organization-id'] as string | undefined;
      request.organizationId = headerOrgId ?? user.organizationId;
      return true;
    }

    if (!user.organizationId) {
      throw new ForbiddenException('Organization context required');
    }

    request.organizationId = user.organizationId;
    return true;
  }
}
