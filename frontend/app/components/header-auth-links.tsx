'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/lib/store';
import { clearCredentials } from '@/lib/slices/auth-slice';
import { setAccessToken } from '@/lib/api';

/**
 * Header nav links: Connexion + S'inscrire when guest,
 * Mes réservations + Déconnexion when authenticated.
 */
export default function HeaderAuthLinks() {
  const router = useRouter();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const handleLogout = () => {
    dispatch(clearCredentials());
    setAccessToken(null);
    router.push('/');
    router.refresh();
  };

  const role = useSelector((state: RootState) => state.auth.user?.role);
  const user = useSelector((state: RootState) => state.auth.user);
  const displayName =
    user?.firstName || user?.lastName
      ? [user?.firstName, user?.lastName].filter(Boolean).join(' ')
      : user?.email ?? '';

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-4">
        {displayName && (
          <span className="rounded-lg px-3 py-2 text-sm text-white/90">
            {displayName}
          </span>
        )}
        {role === 'ADMIN' && (
          <Link
            href="/admin"
            className="rounded-lg px-4 py-2 text-brand-accent transition hover:bg-brand-deep/30 hover:text-white"
          >
            Admin
          </Link>
        )}
        <Link
          href="/reservations"
          className="rounded-lg px-4 py-2 text-white/90 transition hover:text-white"
        >
          Mes réservations
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg bg-brand-accent px-4 py-2 font-medium text-white transition hover:bg-brand-mid"
        >
          Déconnexion
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/login"
        className="rounded-lg px-4 py-2 text-brand-accent transition hover:bg-brand-deep/50 hover:text-white"
      >
        Connexion
      </Link>
      <Link
        href="/register"
        className="rounded-lg bg-brand-accent px-4 py-2 font-medium text-white transition hover:bg-brand-mid"
      >
        S&apos;inscrire
      </Link>
    </div>
  );
}
