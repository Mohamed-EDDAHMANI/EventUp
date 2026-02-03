import type { EventItem } from '@/lib/api/types';
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

function EventCard({ event }: { event: EventItem }) {
  const remaining =
    event.remainingPlaces ?? Math.max(0, (event.capacity ?? 0) - (event.reservedCount ?? 0));
  const full = remaining <= 0;

  return (
    <article className="rounded-2xl border border-brand-deep/50 bg-brand-deep/20 p-6 transition hover:border-brand-deep/80">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="font-semibold text-white">{event.title}</h3>
        {event.status === 'CANCELLED' && (
          <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
            Annulé
          </span>
        )}
      </div>
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
      <div className="flex flex-col gap-2">
        <EventCardReserveButton eventId={event._id} full={full} />
      </div>
    </article>
  );
}

type EventsListProps = {
  initialEvents: EventItem[];
  error?: string | null;
};

export default function EventsList({ initialEvents, error }: EventsListProps) {
  if (error) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="mb-8 text-2xl font-bold text-white">Événements à venir</h2>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      </section>
    );
  }

  if (initialEvents.length === 0) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="mb-8 text-2xl font-bold text-white">Événements à venir</h2>
        <p className="rounded-2xl border border-brand-deep/50 bg-brand-deep/20 p-8 text-center text-white/70">
          Aucun événement à venir pour le moment.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <h2 className="mb-8 text-2xl font-bold text-white">Événements à venir</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {initialEvents.map((event) => (
          <EventCard key={event._id} event={event} />
        ))}
      </div>
    </section>
  );
}
