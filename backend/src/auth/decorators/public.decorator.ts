import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Routes decorated with @Public() bypass the global JWT guard.
 * Use for login, register, health, etc.
 *
 * @example
 * @Public()
 * @Post('login')
 * login() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
