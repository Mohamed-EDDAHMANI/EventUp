'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import { reservationsService } from '@/lib/api/services/reservations.service';
import ErrorAlert from '@/app/components/error-alert';

export default function ReserverPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?redirect=/events/${eventId}/reserver`);
      return;
    }
    if (!eventId) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setStatus('loading');
        setMessage('');
      }
    });
    reservationsService
      .create({ eventId })
      .then(() => {
        if (!cancelled) {
          setStatus('success');
          setMessage('Votre réservation a bien été enregistrée (statut : En attente).');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setStatus('error');
          setMessage(err?.message ?? 'Impossible de créer la réservation.');
        }
      });
    return () => { cancelled = true; };
  }, [eventId, isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <header className="border-b border-brand-deep/50 px-6 py-4">
        <nav className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-white">
            EventUP
          </Link>
          <Link
            href={`/events/${eventId}`}
            className="rounded-lg px-4 py-2 text-white/80 transition hover:text-white"
          >
            ← Retour à l&apos;événement
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-lg px-6 py-16 text-center">
        {status === 'loading' && (
          <p className="text-lg text-white/80">Création de votre réservation...</p>
        )}
        {status === 'success' && (
          <>
            <p className="mb-6 text-lg text-green-400">{message}</p>
            <div className="flex flex-col gap-3">
              <Link
                href="/reservations"
                className="rounded-xl bg-brand-accent px-6 py-3 font-semibold text-white transition hover:bg-brand-mid"
              >
                Voir mes réservations
              </Link>
              <button
                type="button"
                onClick={() => {
                  router.push(`/events/${eventId}`);
                  router.refresh();
                }}
                className="text-white/70 underline hover:text-white"
              >
                Retour à l&apos;événement (données à jour)
              </button>
            </div>
          </>
        )}
        {status === 'error' && (
          <>
            <ErrorAlert message={message} className="mb-6" />
            <Link
              href={`/events/${eventId}`}
              className="inline-block rounded-xl bg-brand-accent px-6 py-3 font-semibold text-white transition hover:bg-brand-mid"
            >
              Retour à l&apos;événement
            </Link>
          </>
        )}
      </main>
    </div>
  );
}
