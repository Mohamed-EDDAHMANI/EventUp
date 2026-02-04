import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getEventForServer } from '@/lib/api/server';
import EventDetailReserve from '@/app/components/event-detail-reserve';
import HeaderAuthLinks from '@/app/components/header-auth-links';

function formatEventDate(dateTime: string): string {
  const d = new Date(dateTime);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * PARTICIPANT: Consulte le détail d'un événement.
 * This page is a Server Component (SSR): event data is fetched on the server.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventForServer(id);
  if (!event) return { title: 'Événement introuvable | EventUP' };
  return {
    title: `${event.title} | EventUP`,
    description: event.description
      ? event.description.slice(0, 160)
      : `Événement le ${formatEventDate(event.dateTime)} à ${event.location}.`,
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = await getEventForServer(id);

  if (!event) {
    notFound();
  }

  const remaining =
    event.remainingPlaces ?? Math.max(0, (event.capacity ?? 0) - (event.reservedCount ?? 0));
  const full = remaining <= 0;

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <header className="border-b border-brand-deep/50 px-6 py-4">
        <nav className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-white"
          >
            EventUP
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="rounded-lg px-4 py-2 text-white/80 transition hover:text-white"
            >
              ← Retour aux événements
            </Link>
            <HeaderAuthLinks />
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-white/70 transition hover:text-brand-accent"
        >
          ← Tous les événements
        </Link>

        <article className="rounded-2xl border border-brand-deep/50 bg-brand-deep/20 p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <h1 className="text-3xl font-bold text-white">{event.title}</h1>
            {event.status === 'CANCELLED' && (
              <span className="rounded bg-red-500/20 px-3 py-1 text-sm font-medium text-red-400">
                Annulé
              </span>
            )}
          </div>

          {event.description && (
            <p className="mb-6 whitespace-pre-wrap text-white/80">{event.description}</p>
          )}

          <dl className="mb-8 space-y-3 text-white/90">
            <div className="flex gap-3">
              <dt className="text-white/60">📅 Date :</dt>
              <dd>{formatEventDate(event.dateTime)}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-white/60">📍 Lieu :</dt>
              <dd>{event.location}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-white/60">Places :</dt>
              <dd>
                {remaining} place{remaining !== 1 ? 's' : ''} restante{remaining !== 1 ? 's' : ''} / {event.capacity}
              </dd>
            </div>
          </dl>

          <EventDetailReserve
            eventId={event._id}
            full={full}
            cancelled={event.status === 'CANCELLED'}
          />
        </article>
      </main>
    </div>
  );
}
