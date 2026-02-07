'use client';

import { useEffect, useState } from 'react';
import { reservationsService } from '@/lib/api/services/reservations.service';
import { eventsService } from '@/lib/api/services/events.service';
import { adminService, type ParticipantOption } from '@/lib/api/services/admin.service';
import type { EventItem, ReservationItem } from '@/lib/api/types';
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

  const [events, setEvents] = useState<EventItem[]>([]);
  const [participants, setParticipants] = useState<ParticipantOption[]>([]);
  const [formEventId, setFormEventId] = useState('');
  const [formUserId, setFormUserId] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ eventId?: string; userId?: string }>({});
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    reservationsService
      .findAllAdmin()
      .then(setList)
      .catch((e) => setError(e?.message ?? 'Erreur'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    reservationsService
      .findAllAdmin()
      .then((data) => {
        if (!cancelled) {
          setError(null);
          setList(data);
        }
      })
      .catch((e) => { if (!cancelled) setError(e?.message ?? 'Erreur'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    eventsService.findAllAdmin().then(setEvents).catch(() => setEvents([]));
    adminService
      .getParticipants()
      .then((data) => setParticipants(Array.isArray(data) ? data : []))
      .catch(() => setParticipants([]));
  }, []);

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

  const publishableEvents = events.filter(
    (e) => e.status === 'PUBLISHED' && new Date(e.dateTime) >= new Date(),
  );

  const handleSubmitReservation = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    const err: { eventId?: string; userId?: string } = {};
    if (!formEventId.trim()) err.eventId = "Sélectionnez un événement";
    if (!formUserId.trim()) err.userId = "Sélectionnez un participant";
    setFieldErrors(err);
    if (Object.keys(err).length > 0) return;

    setFormSubmitting(true);
    reservationsService
      .adminCreate({ eventId: formEventId, userId: formUserId })
      .then(() => {
        setFormSuccess('Réservation créée avec succès (statut : En attente).');
        setFormEventId('');
        setFormUserId('');
        setFieldErrors({});
        load();
        setTimeout(() => setFormSuccess(null), 5000);
      })
      .catch((errApi) => {
        setFormError(errApi?.message ?? 'Impossible de créer la réservation.');
      })
      .finally(() => setFormSubmitting(false));
  };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-bold text-white">Réservations</h1>

      {/* Formulaire de demande de réservation (Admin) */}
      <section className="mb-8 rounded-xl border border-brand-deep/50 bg-brand-deep/20 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Créer une réservation pour un participant</h2>
        <form onSubmit={handleSubmitReservation} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex-1 space-y-1">
            <label htmlFor="admin-res-event" className="block text-sm font-medium text-white/90">
              Événement
            </label>
            <select
              id="admin-res-event"
              value={formEventId}
              onChange={(e) => {
                setFormEventId(e.target.value);
                setFieldErrors((prev) => ({ ...prev, eventId: undefined }));
              }}
              className={`w-full rounded-lg border bg-brand-dark px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-accent ${
                fieldErrors.eventId ? 'border-red-500' : 'border-brand-deep/50'
              }`}
            >
              <option value="">-- Choisir un événement --</option>
              {publishableEvents.map((ev) => (
                <option key={ev._id} value={ev._id}>
                  {ev.title} — {new Date(ev.dateTime).toLocaleDateString('fr-FR')}
                </option>
              ))}
            </select>
            {fieldErrors.eventId && (
              <p className="text-sm text-red-400" role="alert">
                {fieldErrors.eventId}
              </p>
            )}
          </div>
          <div className="flex-1 space-y-1">
            <label htmlFor="admin-res-user" className="block text-sm font-medium text-white/90">
              Participant
            </label>
            <select
              id="admin-res-user"
              value={formUserId}
              onChange={(e) => {
                setFormUserId(e.target.value);
                setFieldErrors((prev) => ({ ...prev, userId: undefined }));
              }}
              className={`w-full rounded-lg border bg-brand-dark px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-accent ${
                fieldErrors.userId ? 'border-red-500' : 'border-brand-deep/50'
              }`}
            >
              <option value="">-- Choisir un participant --</option>
              {(Array.isArray(participants) ? participants : []).map((p) => (
                <option key={p._id} value={p._id}>
                  {p.firstName} {p.lastName} — {p.email}
                </option>
              ))}
            </select>
            {fieldErrors.userId && (
              <p className="text-sm text-red-400" role="alert">
                {fieldErrors.userId}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={formSubmitting}
            className="shrink-0 rounded-lg bg-brand-accent px-4 py-2 font-medium text-white transition hover:bg-brand-mid disabled:opacity-50"
          >
            {formSubmitting ? 'Création...' : 'Créer la réservation'}
          </button>
        </form>
        {formError && (
          <ErrorAlert
            message={formError}
            title="Erreur"
            onDismiss={() => setFormError(null)}
            className="mt-4"
          />
        )}
        {formSuccess && (
          <div
            role="status"
            className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-300"
          >
            {formSuccess}
          </div>
        )}
      </section>

      {error && (
        <ErrorAlert message={error} onDismiss={() => setError(null)} className="mb-6" />
      )}

      <div className="overflow-x-auto rounded-xl border border-brand-deep/50 bg-brand-deep/20">
        {loading && list.length === 0 ? (
          <p className="p-8 text-center text-white/70">Chargement des réservations...</p>
        ) : (
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
        )}
      </div>

      {list.length === 0 && !loading && (
        <p className="mt-6 rounded-xl border border-brand-deep/50 bg-brand-deep/20 p-8 text-center text-white/70">
          Aucune réservation.
        </p>
      )}
    </div>
  );
}
