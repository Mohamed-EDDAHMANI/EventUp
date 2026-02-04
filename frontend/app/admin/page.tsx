'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/lib/api/services/admin.service';
import type { AdminStats } from '@/lib/api/services/admin.service';
import ErrorAlert from '@/app/components/error-alert';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminService
      .getStats()
      .then(setStats)
      .catch((err) => setError(err?.message ?? 'Erreur'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-white/70">Chargement des indicateurs...</p>;
  }
  if (error) {
    return <ErrorAlert message={error} onDismiss={() => setError(null)} />;
  }
  if (!stats) return null;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-8 text-2xl font-bold text-white">Tableau de bord</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-brand-deep/50 bg-brand-deep/20 p-6">
          <p className="text-sm text-white/60">Événements à venir</p>
          <p className="mt-1 text-3xl font-bold text-white">
            {stats.upcomingEventsCount}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-deep/50 bg-brand-deep/20 p-6">
          <p className="text-sm text-white/60">Taux de remplissage</p>
          <p className="mt-1 text-3xl font-bold text-brand-accent">
            {stats.fillRatePercent} %
          </p>
        </div>
        <div className="rounded-2xl border border-brand-deep/50 bg-brand-deep/20 p-6">
          <p className="text-sm text-white/60">Places réservées</p>
          <p className="mt-1 text-3xl font-bold text-white">
            {stats.totalReserved} / {stats.totalCapacity}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-deep/50 bg-brand-deep/20 p-6">
          <p className="text-sm text-white/60">Réservations par statut</p>
          <div className="mt-2 space-y-1 text-sm">
            <p>
              <span className="text-amber-400">En attente :</span>{' '}
              {stats.reservationsByStatus.PENDING}
            </p>
            <p>
              <span className="text-green-400">Confirmées :</span>{' '}
              {stats.reservationsByStatus.CONFIRMED}
            </p>
            <p>
              <span className="text-red-400">Annulées :</span>{' '}
              {stats.reservationsByStatus.CANCELLED}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
