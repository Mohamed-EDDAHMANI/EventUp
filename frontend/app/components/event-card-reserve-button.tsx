'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';

type Props = {
  eventId: string;
  full: boolean;
  hasReserved?: boolean;
  cancelled?: boolean;
};

export default function EventCardReserveButton({
  eventId,
  full,
  hasReserved,
  cancelled,
}: Props) {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  if (cancelled) {
    return (
      <span className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-center text-sm font-medium text-red-400">
        Annulé
      </span>
    );
  }
  if (full) {
    return (
      <span className="rounded-lg border border-brand-deep/50 px-4 py-2 text-center text-sm text-white/60">
        Complet
      </span>
    );
  }
  if (isAuthenticated && hasReserved) {
    return (
      <span className="rounded-lg border border-brand-deep/50 bg-brand-deep/30 px-4 py-2 text-center text-sm text-white/70">
        Réservé
      </span>
    );
  }
  if (isAuthenticated) {
    return (
      <Link
        href={`/events/${eventId}`}
        className="rounded-lg bg-brand-accent px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-brand-mid"
      >
        Réserver
      </Link>
    );
  }
  return (
    <Link
      href="/login"
      className="rounded-lg border border-brand-mid px-4 py-2 text-center text-sm font-medium text-brand-accent transition hover:bg-brand-deep/50"
    >
      Connectez-vous pour réserver
    </Link>
  );
}
