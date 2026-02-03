'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/lib/hooks';
import { setCredentials } from '@/lib/slices/auth-slice';
import { authService, setAccessToken, mapApiUserToAuthUser } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.register({
        firstName,
        lastName,
        email,
        password,
      });
      dispatch(
        setCredentials({
          user: mapApiUserToAuthUser(res.user),
          accessToken: res.access_token,
        }),
      );
      setAccessToken(res.access_token);
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inscription impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <header className="border-b border-brand-deep/50 px-6 py-4">
        <nav className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-white">
            EventUP
          </Link>
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-brand-accent transition hover:bg-brand-deep/50"
          >
            Connexion
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-140px)] max-w-md flex-col justify-center px-6 py-12">
        <div className="rounded-2xl border border-brand-deep/50 bg-brand-deep/20 p-8 shadow-xl">
          <h1 className="mb-2 text-2xl font-bold">Créer un compte</h1>
          <p className="mb-6 text-white/70">
            Rejoignez EventUP pour réserver des événements.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div
                role="alert"
                className="rounded-lg bg-red-500/20 px-4 py-3 text-sm text-red-200"
              >
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-1 block text-sm font-medium"
                >
                  Prénom
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoComplete="given-name"
                  className="w-full rounded-lg border border-brand-mid/50 bg-brand-dark px-4 py-3 text-white placeholder-white/40 outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/30"
                  placeholder="Jean"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="mb-1 block text-sm font-medium"
                >
                  Nom
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  autoComplete="family-name"
                  className="w-full rounded-lg border border-brand-mid/50 bg-brand-dark px-4 py-3 text-white placeholder-white/40 outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/30"
                  placeholder="Dupont"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-brand-mid/50 bg-brand-dark px-4 py-3 text-white placeholder-white/40 outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/30"
                placeholder="vous@exemple.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium"
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-lg border border-brand-mid/50 bg-brand-dark px-4 py-3 text-white placeholder-white/40 outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/30"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-white/50">
                Minimum 6 caractères
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-brand-accent py-3 font-semibold text-white transition hover:bg-brand-mid disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Inscription...' : "S'inscrire"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/70">
            Déjà un compte ?{' '}
            <Link
              href="/login"
              className="font-medium text-brand-accent hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
