'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { eventsService } from '@/lib/api/services/events.service';
import type { EventItem } from '@/lib/api/types';
import ErrorAlert from '@/app/components/error-alert';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publié',
  CANCELLED: 'Annulé',
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    eventsService
      .findAllAdmin()
      .then(setEvents)
      .catch((e) => setError(e?.message ?? 'Erreur'))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handlePublish = (id: string) => {
    setActionLoading(id);
    eventsService
      .publish(id)
      .then(() => load())
      .catch((e) => setError(e?.message ?? 'Erreur'))
      .finally(() => setActionLoading(null));
  };

  const handleCancel = (id: string) => {
    setActionLoading(id);
    eventsService
      .cancel(id)
      .then(() => load())
      .catch((e) => setError(e?.message ?? 'Erreur'))
      .finally(() => setActionLoading(null));
  };

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer cet événement (brouillon) ?')) return;
    setActionLoading(id);
    eventsService
      .remove(id)
      .then(() => load())
      .catch((e) => setError(e?.message ?? 'Erreur'))
      .finally(() => setActionLoading(null));
  };

  if (loading) return <p className="text-white/70">Chargement...</p>;
  if (error) {
    return (
      <ErrorAlert message={error} onDismiss={() => setError(null)} className="mb-6" />
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Événements</h1>
        <Link
          href="/admin/events/new"
          className="rounded-lg bg-brand-accent px-4 py-2 font-medium text-white transition hover:bg-brand-mid"
        >
          Créer un événement
        </Link>
      </div>

      <div className="space-y-4">
        {events.map((event) => {
          const remaining =
            (event.capacity ?? 0) - (event.reservedCount ?? 0);
          const busy = actionLoading === event._id;
          return (
            <div
              key={event._id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand-deep/50 bg-brand-deep/20 p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-white">{event.title}</h2>
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      event.status === 'PUBLISHED'
                        ? 'bg-green-500/20 text-green-400'
                        : event.status === 'CANCELLED'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {statusLabels[event.status] ?? event.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-white/60">
                  📅 {formatDate(event.dateTime)} · 📍 {event.location} ·{' '}
                  {event.reservedCount ?? 0}/{event.capacity} places
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/events/${event._id}/edit`}
                  className="rounded-lg border border-brand-mid/50 px-3 py-1.5 text-sm text-white/90 transition hover:bg-brand-deep/50"
                >
                  Modifier
                </Link>
                {event.status === 'DRAFT' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handlePublish(event._id)}
                      disabled={busy}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white transition hover:bg-green-500 disabled:opacity-50"
                    >
                      {busy ? '...' : 'Publier'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(event._id)}
                      disabled={busy}
                      className="rounded-lg bg-red-600/80 px-3 py-1.5 text-sm text-white transition hover:bg-red-600 disabled:opacity-50"
                    >
                      Supprimer
                    </button>
                  </>
                )}
                {event.status === 'PUBLISHED' && (
                  <button
                    type="button"
                    onClick={() => handleCancel(event._id)}
                    disabled={busy}
                    className="rounded-lg bg-amber-600/80 px-3 py-1.5 text-sm text-white transition hover:bg-amber-600 disabled:opacity-50"
                  >
                    {busy ? '...' : 'Annuler l\'événement'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <p className="rounded-xl border border-brand-deep/50 bg-brand-deep/20 p-8 text-center text-white/70">
          Aucun événement.
        </p>
      )}
    </div>
  );
}
