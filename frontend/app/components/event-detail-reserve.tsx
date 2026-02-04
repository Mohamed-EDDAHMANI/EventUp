'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import { reservationsService } from '@/lib/api/services/reservations.service';
import type { EventItem } from '@/lib/api/types';

function getEventId(event: string | EventItem): string {
  return typeof event === 'string' ? event : event._id;
}

type Props = {
  eventId: string;
  full: boolean;
  cancelled?: boolean;
};

export default function EventDetailReserve({ eventId, full, cancelled }: Props) {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [hasReserved, setHasReserved] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setHasReserved(false);
      return;
    }
    reservationsService
      .findMyReservations()
      .then((list) => {
        const reserved = list
          .filter((r) => r.status !== 'CANCELLED')
          .some((r) => getEventId(r.event) === eventId);
        setHasReserved(reserved);
      })
      .catch(() => setHasReserved(false));
  }, [eventId, isAuthenticated]);

  if (cancelled) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-center font-medium text-red-400">
        Cet événement est annulé. Aucune réservation possible.
      </div>
    );
  }
  if (full) {
    return (
      <div className="rounded-xl border border-brand-deep/50 bg-brand-deep/30 p-4 text-center text-white/70">
        Cet événement est complet. Aucune réservation possible.
      </div>
    );
  }
  if (isAuthenticated && hasReserved) {
    return (
      <div className="rounded-xl border border-brand-deep/50 bg-brand-deep/30 p-4 text-center text-white/80">
        Vous avez déjà réservé une place pour cet événement.
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
