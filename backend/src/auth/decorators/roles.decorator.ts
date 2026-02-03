import { SetMetadata } from '@nestjs/common';
import { Role } from '../../users/schemas/user.schema';

export const ROLES_KEY = 'roles';

/**
 * Decorator to restrict route access by role.
 * @example
 * @Roles('ADMIN')
 * @Get('admin-only')
 * adminOnly() { ... }
 *
 * @Roles('ADMIN', 'PARTICIPANT')
 * @Get('any-authenticated')
 * anyAuthenticated() { ... }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
