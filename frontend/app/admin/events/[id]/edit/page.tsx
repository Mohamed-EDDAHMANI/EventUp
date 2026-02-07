'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { eventsService } from '@/lib/api/services/events.service';
import ErrorAlert from '@/app/components/error-alert';

export default function AdminEditEventPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    dateTime: '',
    location: '',
    capacity: 50,
  });

  useEffect(() => {
    if (!id) return;
    eventsService
      .findOne(id)
      .then((event) => {
        const d = event.dateTime ? new Date(event.dateTime) : null;
        const dateTimeLocal = d
          ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
          : '';
        setForm({
          title: event.title,
          description: event.description ?? '',
          dateTime: dateTimeLocal,
          location: event.location,
          capacity: event.capacity ?? 50,
        });
      })
      .catch((e) => setError(e?.message ?? 'Événement introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await eventsService.update(id, {
        title: form.title,
        description: form.description || undefined,
        location: form.location,
        capacity: Number(form.capacity),
        dateTime: new Date(form.dateTime).toISOString(),
      });
      router.push('/admin/events');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-white/70">Chargement...</p>;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-bold text-white">Modifier l&apos;événement</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        )}
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-white/90">
            Titre *
          </label>
          <input
            id="title"
            type="text"
            required
            maxLength={200}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-lg border border-brand-deep/50 bg-brand-dark px-4 py-2 text-white placeholder-white/40 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
          />
        </div>
        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-white/90">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            maxLength={2000}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded-lg border border-brand-deep/50 bg-brand-dark px-4 py-2 text-white placeholder-white/40 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
          />
        </div>
        <div>
          <label htmlFor="dateTime" className="mb-1 block text-sm font-medium text-white/90">
            Date et heure *
          </label>
          <input
            id="dateTime"
            type="datetime-local"
            required
            value={form.dateTime}
            onChange={(e) => setForm((f) => ({ ...f, dateTime: e.target.value }))}
            className="w-full rounded-lg border border-brand-deep/50 bg-brand-dark px-4 py-2 text-white focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
          />
        </div>
        <div>
          <label htmlFor="location" className="mb-1 block text-sm font-medium text-white/90">
            Lieu *
          </label>
          <input
            id="location"
            type="text"
            required
            maxLength={500}
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            className="w-full rounded-lg border border-brand-deep/50 bg-brand-dark px-4 py-2 text-white placeholder-white/40 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
          />
        </div>
        <div>
          <label htmlFor="capacity" className="mb-1 block text-sm font-medium text-white/90">
            Capacité maximale *
          </label>
          <input
            id="capacity"
            type="number"
            required
            min={1}
            max={100000}
            value={form.capacity}
            onChange={(e) =>
              setForm((f) => ({ ...f, capacity: parseInt(e.target.value, 10) || 1 }))
            }
            className="w-full rounded-lg border border-brand-deep/50 bg-brand-dark px-4 py-2 text-white focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-accent px-6 py-2 font-medium text-white transition hover:bg-brand-mid disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <Link
            href="/admin/events"
            className="rounded-lg border border-brand-deep/50 px-6 py-2 text-white/90 transition hover:bg-brand-deep/30"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
