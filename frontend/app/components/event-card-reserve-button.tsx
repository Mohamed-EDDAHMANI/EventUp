'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';

type Props = {
  eventId: string;
  full: boolean;
};

export default function EventCardReserveButton({ eventId, full }: Props) {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  if (full) {
    return (
      <span className="rounded-lg border border-brand-deep/50 px-4 py-2 text-center text-sm text-white/60">
        Complet
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
