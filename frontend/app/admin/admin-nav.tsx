'use client';

import Link from 'next/link';

const navLinks = [
  { href: '/admin', label: 'Tableau de bord' },
  { href: '/admin/events', label: 'Événements' },
  { href: '/admin/events/new', label: 'Créer un événement' },
  { href: '/admin/reservations', label: 'Réservations' },
];

export default function AdminNav() {
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
    </nav>
  );
}
