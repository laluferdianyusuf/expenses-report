import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

export async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  return argon2.verify(hash, password);
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateToken(): string {
  return randomBytes(48).toString('hex');
}

export function buildTenantContext(
  user: {
    sub: string;
    organizationId: string | null;
    permissions: string[];
    roleSlug: string;
  },
  organizationId: string,
  branchId?: string,
) {
  return {
    organizationId,
    userId: user.sub,
    branchId,
    permissions: user.permissions,
    roleSlug: user.roleSlug,
  };
}
