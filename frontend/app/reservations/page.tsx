'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/hooks';
import { reservationsService } from '@/lib/api/services/reservations.service';
import type { ReservationItem } from '@/lib/api/types';
import ErrorAlert from '@/app/components/error-alert';
import HeaderAuthLinks from '@/app/components/header-auth-links';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getEventTitle(res: ReservationItem): string {
  const e = res.event;
  return typeof e === 'object' && e !== null && 'title' in e ? String((e as { title: string }).title) : 'Événement';
}

function getEventDateTime(res: ReservationItem): string {
  const e = res.event;
  if (typeof e === 'object' && e !== null && 'dateTime' in e) {
    return formatDate(String((e as { dateTime: string }).dateTime));
  }
  return '–';
}

function getEventLocation(res: ReservationItem): string {
  const e = res.event;
  return typeof e === 'object' && e !== null && 'location' in e ? String((e as { location: string }).location) : '–';
}

function getEventPlaces(res: ReservationItem): string | null {
  const e = res.event;
  if (typeof e !== 'object' || e === null) return null;
  const ev = e as { capacity?: number; reservedCount?: number };
  if (ev.reservedCount != null && ev.capacity != null) return `${ev.reservedCount} / ${ev.capacity}`;
  return null;
}

const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
};

export default function ReservationsPage() {
  const router = useRouter();
  const isAuthenticated = useAppSelector((state) => !!state.auth.isAuthenticated);
  const [list, setList] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [downloadingTicketId, setDownloadingTicketId] = useState<string | null>(null);

  const fetchReservations = useCallback(() => {
    setLoading(true);
    setError(null);
    reservationsService
      .findMyReservations()
      .then(setList)
      .catch((err) => setError(err?.message ?? 'Erreur'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login?redirect=/reservations');
      return;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    });
    reservationsService
      .findMyReservations()
      .then((data) => { if (!cancelled) setList(data); })
      .catch((err) => { if (!cancelled) setError(err?.message ?? 'Erreur'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated, router]);

  const handleRefresh = () => {
    setError(null);
    fetchReservations();
  };

  const handleDownloadTicket = (id: string, eventTitle?: string) => {
    setDownloadingTicketId(id);
    setError(null);
    reservationsService
      .downloadTicketPdf(id, eventTitle)
      .catch((err) => setError(err?.message ?? 'Impossible de télécharger le billet.'))
      .finally(() => setDownloadingTicketId(null));
  };

  const handleCancel = (id: string) => {
    setCancellingId(id);
    reservationsService
      .cancel(id)
      .then(() => setList((prev) => prev.map((r) => (r._id === id ? { ...r, status: 'CANCELLED' as const } : r))))
      .catch((err) => setError(err?.message ?? 'Erreur'))
      .finally(() => setCancellingId(null));
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <header className="border-b border-brand-deep/50 px-6 py-4">
        <nav className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-white">
            EventUP
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="rounded-lg px-4 py-2 text-white/80 transition hover:text-white">
              Accueil
            </Link>
            <HeaderAuthLinks />
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-white">Mes réservations</h1>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="rounded-lg border border-brand-deep/50 px-4 py-2 text-sm text-white/80 transition hover:bg-brand-deep/30 hover:text-white disabled:opacity-50"
          >
            Actualiser
          </button>
        </div>

        {loading && <p className="text-white/70">Chargement...</p>}
        {error && (
          <ErrorAlert
            message={error}
            onDismiss={() => setError(null)}
            className="mb-6"
          />
        )}
        {!loading && !error && list.length === 0 && (
          <p className="rounded-2xl border border-brand-deep/50 bg-brand-deep/20 p-8 text-center text-white/70">
            Vous n&apos;avez aucune réservation.
          </p>
        )}
        {!loading && list.length > 0 && (
          <ul className="space-y-4">
            {list.map((res) => (
              <li
                key={res._id}
                className="rounded-2xl border border-brand-deep/50 bg-brand-deep/20 p-6"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/events/${typeof res.event === 'object' && res.event && '_id' in res.event ? (res.event as { _id: string })._id : res.event}`}
                    className="font-semibold text-white hover:text-brand-accent"
                  >
                    {getEventTitle(res)}
                  </Link>
                  <span
                    className={`rounded px-2 py-0.5 text-sm ${
                      res.status === 'CONFIRMED'
                        ? 'bg-green-500/20 text-green-400'
                        : res.status === 'CANCELLED'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {statusLabels[res.status] ?? res.status}
                  </span>
                </div>
                <p className="text-sm text-white/60">📅 {getEventDateTime(res)}</p>
                <p className="text-sm text-white/60">📍 {getEventLocation(res)}</p>
                {getEventPlaces(res) != null && (
                  <p className="text-sm text-white/60">Places : {getEventPlaces(res)}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {res.status === 'CONFIRMED' && (
                    <button
                      type="button"
                      onClick={() => handleDownloadTicket(res._id, getEventTitle(res))}
                      disabled={downloadingTicketId === res._id}
                      className="rounded-lg bg-green-600/80 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-600 disabled:opacity-50"
                    >
                      {downloadingTicketId === res._id
                        ? 'Téléchargement...'
                        : 'Télécharger le billet PDF'}
                    </button>
                  )}
                  {res.status !== 'CANCELLED' && (
                    <button
                      type="button"
                      onClick={() => handleCancel(res._id)}
                      disabled={cancellingId === res._id}
                      className="rounded-lg border border-red-500/50 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                      {cancellingId === res._id ? 'Annulation...' : 'Annuler la réservation'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
