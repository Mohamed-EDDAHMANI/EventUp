'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import type { EventItem } from '@/lib/api/types';
import { reservationsService } from '@/lib/api/services/reservations.service';
import EventCardReserveButton from './event-card-reserve-button';

function formatEventDate(dateTime: string): string {
  const d = new Date(dateTime);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getEventIdFromReservation(event: string | EventItem): string {
  if (typeof event === 'string') return event;
  return event._id;
}

type EventsGridClientProps = {
  initialEvents: EventItem[];
};

export default function EventsGridClient({ initialEvents }: EventsGridClientProps) {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [reservedEventIds, setReservedEventIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      setReservedEventIds(new Set());
      return;
    }
    reservationsService
      .findMyReservations()
      .then((list) => {
        const ids = new Set(
          list
            .filter((r) => r.status !== 'CANCELLED')
            .map((r) => getEventIdFromReservation(r.event)),
        );
        setReservedEventIds(ids);
      })
      .catch(() => setReservedEventIds(new Set()));
  }, [isAuthenticated]);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {initialEvents.map((event) => {
        const remaining =
          event.remainingPlaces ?? Math.max(0, (event.capacity ?? 0) - (event.reservedCount ?? 0));
        const full = remaining <= 0;
        const hasReserved = reservedEventIds.has(event._id);

        const isCancelled = event.status === 'CANCELLED';
        return (
          <article
            key={event._id}
            className={`rounded-2xl border p-6 transition ${
              isCancelled
                ? 'border-red-500/40 bg-red-500/5 opacity-85 hover:border-red-500/50'
                : 'border-brand-deep/50 bg-brand-deep/20 hover:border-brand-deep/80'
            }`}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <Link
                href={`/events/${event._id}`}
                className="font-semibold text-white underline-offset-2 transition hover:text-brand-accent hover:underline"
              >
                <h3 className="inline">{event.title}</h3>
              </Link>
              {isCancelled && (
                <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                  Annulé
                </span>
              )}
            </div>
            <Link href={`/events/${event._id}`} className="block">
              {event.description && (
                <p className="mb-3 line-clamp-2 text-sm text-white/70">{event.description}</p>
              )}
              <div className="mb-4 space-y-1 text-sm text-white/60">
                <p>📅 {formatEventDate(event.dateTime)}</p>
                <p>📍 {event.location}</p>
                <p>
                  Places : {remaining} / {event.capacity}
                </p>
              </div>
              <span className="inline-block text-sm font-medium text-brand-accent transition hover:text-brand-mid">
                Voir le détail →
              </span>
            </Link>
            <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
              <EventCardReserveButton
                eventId={event._id}
                full={full}
                hasReserved={hasReserved}
                cancelled={isCancelled}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
