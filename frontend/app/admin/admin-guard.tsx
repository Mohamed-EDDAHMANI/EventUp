'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const role = useSelector((state: RootState) => state.auth.user?.role);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login?redirect=' + encodeURIComponent('/admin'));
      return;
    }
    if (role !== 'ADMIN') {
      router.replace('/');
    }
  }, [isAuthenticated, role, router]);

  if (!isAuthenticated || role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-dark text-white">
        <p className="text-white/70">Chargement...</p>
      </div>
    );
  }

  return <>{children}</>;
}
