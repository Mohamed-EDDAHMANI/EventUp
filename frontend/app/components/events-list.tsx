import type { EventItem } from '@/lib/api/types';
import ErrorAlert from './error-alert';
import EventsGridClient from './events-grid-client';

type EventsListProps = {
  initialEvents: EventItem[];
  error?: string | null;
};

export default function EventsList({ initialEvents, error }: EventsListProps) {
  if (error) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="mb-8 text-2xl font-bold text-white">Événements à venir</h2>
        <ErrorAlert message={error} />
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
      <EventsGridClient initialEvents={initialEvents} />
    </section>
  );
}
