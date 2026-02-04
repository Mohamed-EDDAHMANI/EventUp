'use client';

import { useEffect, useState } from 'react';
import { reservationsService } from '@/lib/api/services/reservations.service';
import type { ReservationItem } from '@/lib/api/types';
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

function getEventTitle(r: ReservationItem): string {
  const e = r.event;
  return typeof e === 'object' && e !== null && 'title' in e ? String((e as { title: string }).title) : '–';
}

function getUserName(r: ReservationItem): string {
  const u = r.user;
  if (typeof u !== 'object' || u === null) return '–';
  const first = 'firstName' in u ? (u as { firstName?: string }).firstName : '';
  const last = 'lastName' in u ? (u as { lastName?: string }).lastName : '';
  const email = 'email' in u ? (u as { email?: string }).email : '';
  if (first || last) return `${first} ${last}`.trim();
  return email || '–';
}

const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
};

export default function AdminReservationsPage() {
  const [list, setList] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    reservationsService
      .findAllAdmin()
      .then(setList)
      .catch((e) => setError(e?.message ?? 'Erreur'))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const runAction = (
    id: string,
    fn: () => Promise<ReservationItem>,
  ) => {
    setError(null);
    setActionId(id);
    fn()
      .then(() => load())
      .catch((e) => setError(e?.message ?? 'Erreur'))
      .finally(() => setActionId(null));
  };

  if (loading) return <p className="text-white/70">Chargement...</p>;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-bold text-white">Réservations</h1>

      {error && (
        <ErrorAlert message={error} onDismiss={() => setError(null)} className="mb-6" />
      )}

      <div className="overflow-x-auto rounded-xl border border-brand-deep/50 bg-brand-deep/20">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-brand-deep/50">
              <th className="p-3 font-medium text-white/90">Événement</th>
              <th className="p-3 font-medium text-white/90">Participant</th>
              <th className="p-3 font-medium text-white/90">Statut</th>
              <th className="p-3 font-medium text-white/90">Date réservation</th>
              <th className="p-3 font-medium text-white/90">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => {
              const busy = actionId === r._id;
              return (
                <tr key={r._id} className="border-b border-brand-deep/30">
                  <td className="p-3 text-white/90">{getEventTitle(r)}</td>
                  <td className="p-3 text-white/90">{getUserName(r)}</td>
                  <td className="p-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        r.status === 'CONFIRMED'
                          ? 'bg-green-500/20 text-green-400'
                          : r.status === 'CANCELLED'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {statusLabels[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="p-3 text-white/70">{formatDate(r.createdAt)}</td>
                  <td className="p-3">
                    {r.status !== 'CANCELLED' && (
                      <div className="flex flex-wrap gap-1">
                        {r.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() =>
                              runAction(r._id, () => reservationsService.adminConfirm(r._id))
                            }
                            disabled={busy}
                            className="rounded bg-green-600/80 px-2 py-1 text-xs text-white hover:bg-green-600 disabled:opacity-50"
                          >
                            Confirmer
                          </button>
                        )}
                        {r.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() =>
                              runAction(r._id, () => reservationsService.adminRefuse(r._id))
                            }
                            disabled={busy}
                            className="rounded bg-amber-600/80 px-2 py-1 text-xs text-white hover:bg-amber-600 disabled:opacity-50"
                          >
                            Refuser
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            runAction(r._id, () => reservationsService.adminCancel(r._id))
                          }
                          disabled={busy}
                          className="rounded bg-red-600/80 px-2 py-1 text-xs text-white hover:bg-red-600 disabled:opacity-50"
                        >
                          Annuler
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {list.length === 0 && !loading && (
        <p className="mt-6 rounded-xl border border-brand-deep/50 bg-brand-deep/20 p-8 text-center text-white/70">
          Aucune réservation.
        </p>
      )}
    </div>
  );
}
