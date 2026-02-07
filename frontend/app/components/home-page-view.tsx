'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import type { EventItem } from '@/lib/api/types';
import { eventsService } from '@/lib/api';
import EventsList from './events-list';
import HeaderAuthLinks from './header-auth-links';

/**
 * Home page for PARTICIPANT and guests.
 * ADMIN users are redirected to /admin (dashboard).
 * Events are fetched client-side so they work for non-authenticated users (no auth required for GET /events).
 */
export default function HomePageView() {
  const router = useRouter();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const role = useSelector((state: RootState) => state.auth.user?.role);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadEvents = () => {
    setError(null);
    setLoading(true);
    eventsService
      .findAll()
      .then((data) => {
        setEvents(data);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Erreur lors du chargement');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setError(null);
        setLoading(true);
      }
    });
    eventsService
      .findAll()
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erreur lors du chargement');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (isAuthenticated && role === 'ADMIN') {
      router.replace('/admin');
    }
  }, [isAuthenticated, role, router]);

  if (isAuthenticated && role === 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-dark text-white">
        <p className="text-white/70">Redirection vers le tableau de bord...</p>
      </div>
    );
  }

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
          <HeaderAuthLinks />
        </nav>
      </header>

      <main className="px-6 py-20">
        <section className="mx-auto max-w-4xl text-center">
          {isAuthenticated && role === 'PARTICIPANT' ? (
            <>
              <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
                Bienvenue sur
                <span className="block text-brand-accent">EventUP</span>
              </h1>
              <p className="mx-auto mb-12 max-w-2xl text-lg text-white/80">
                Parcourez les événements à venir et réservez votre place en quelques clics.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/reservations"
                  className="w-full rounded-xl bg-brand-accent px-8 py-4 text-center font-semibold text-white shadow-lg transition hover:bg-brand-mid sm:w-auto"
                >
                  Mes réservations
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
                Découvrez et réservez
                <span className="block text-brand-accent">vos événements</span>
              </h1>
              <p className="mx-auto mb-12 max-w-2xl text-lg text-white/80">
                EventUP vous permet de trouver des événements près de chez vous,
                réserver votre place en quelques clics et gérer vos réservations.
              </p>
              {!isAuthenticated && (
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href="/register"
                    className="w-full rounded-xl bg-brand-accent px-8 py-4 text-center font-semibold text-white shadow-lg transition hover:bg-brand-mid sm:w-auto"
                  >
                    Créer un compte
                  </Link>
                  <Link
                    href="/login"
                    className="w-full rounded-xl border-2 border-brand-mid px-8 py-4 text-center font-semibold text-white transition hover:bg-brand-deep sm:w-auto"
                  >
                    J&apos;ai déjà un compte
                  </Link>
                </div>
              )}
            </>
          )}
        </section>

        <EventsList
          initialEvents={events}
          error={error}
          loading={loading}
          onRetry={loadEvents}
        />

        <section className="mx-auto mt-32 grid max-w-5xl gap-8 sm:grid-cols-3">
          <div className="rounded-2xl border border-brand-deep/50 bg-brand-deep/20 p-6 text-center">
            <div className="mb-3 text-3xl">🎫</div>
            <h2 className="mb-2 font-semibold text-brand-accent">
              Événements variés
            </h2>
            <p className="text-sm text-white/70">
              Concerts, conférences, meetups et plus encore.
            </p>
          </div>
          <div className="rounded-2xl border border-brand-deep/50 bg-brand-deep/20 p-6 text-center">
            <div className="mb-3 text-3xl">⚡</div>
            <h2 className="mb-2 font-semibold text-brand-accent">
              Réservation rapide
            </h2>
            <p className="text-sm text-white/70">
              Réservez en quelques clics, recevez votre billet.
            </p>
          </div>
          <div className="rounded-2xl border border-brand-deep/50 bg-brand-deep/20 p-6 text-center">
            <div className="mb-3 text-3xl">🔒</div>
            <h2 className="mb-2 font-semibold text-brand-accent">
              Sécurisé et simple
            </h2>
            <p className="text-sm text-white/70">
              Compte protégé et gestion de vos réservations.
            </p>
          </div>
        </section>
      </main>

      <footer className="mt-24 border-t border-brand-deep/50 px-6 py-8 text-center text-sm text-white/60">
        © {new Date().getFullYear()} EventUP. Tous droits réservés.
      </footer>
    </div>
  );
}
