'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { clearCredentials } from '@/lib/slices/auth-slice';
import { setAccessToken } from '@/lib/api';

const navLinks = [
  { href: '/admin', label: 'Tableau de bord' },
  { href: '/admin/events', label: 'Événements' },
  { href: '/admin/events/new', label: 'Créer un événement' },
  { href: '/admin/reservations', label: 'Réservations' },
];

export default function AdminNav() {
  const router = useRouter();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(clearCredentials());
    setAccessToken(null);
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="flex flex-wrap items-center gap-2 border-b border-brand-deep/50 px-6 py-4">
      <Link
        href="/admin"
        className="mr-4 text-lg font-bold tracking-tight text-white"
      >
        Admin EventUP
      </Link>
      {navLinks.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className="rounded-lg px-3 py-2 text-sm text-white/80 transition hover:bg-brand-deep/30 hover:text-white"
        >
          {label}
        </Link>
      ))}
      <Link
        href="/"
        className="ml-auto rounded-lg px-3 py-2 text-sm text-brand-accent transition hover:bg-brand-deep/30"
      >
        ← Retour au site
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-lg bg-brand-accent px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-mid"
      >
        Déconnexion
      </button>
    </nav>
  );
}
