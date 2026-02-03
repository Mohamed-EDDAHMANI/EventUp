'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';

type Props = {
  eventId: string;
  full: boolean;
};

export default function EventDetailReserve({ eventId, full }: Props) {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  if (full) {
    return (
      <div className="rounded-xl border border-brand-deep/50 bg-brand-deep/30 p-4 text-center text-white/70">
        Cet événement est complet. Aucune réservation possible.
      </div>
    );
  }
  if (isAuthenticated) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/events/${eventId}/reserver`}
          className="rounded-xl bg-brand-accent px-6 py-3 text-center font-semibold text-white transition hover:bg-brand-mid"
        >
          Réserver ma place
        </Link>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-brand-mid/50 bg-brand-deep/30 p-4 text-center">
      <p className="mb-3 text-white/80">
        Vous devez être connecté pour réserver une place.
      </p>
      <Link
        href={`/login?redirect=/events/${eventId}`}
        className="inline-block rounded-lg bg-brand-accent px-6 py-2 font-medium text-white transition hover:bg-brand-mid"
      >
        Se connecter
      </Link>
    </div>
  );
}
