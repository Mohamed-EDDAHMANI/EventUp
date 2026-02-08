import type { EventItem } from '@/lib/api/types';

/**
 * Base URL for API when running on the server.
 * Use NEXT_PUBLIC_API_URL in Docker (e.g. http://backend:3001) or when set.
 */
function getServerApiBase(): string {
  return 'http://backend:3001';
}

/**
 * Fetches the list of published events on the server (for SSR).
 * No auth required (public endpoint).
 */
export async function getEventsForServer(): Promise<EventItem[]> {
  const base = getServerApiBase();
  const res = await fetch(`${base}/events`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    throw new Error(`Events fetch failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetches a single event by id on the server (for SSR).
 * No auth required (public endpoint). Returns null if not found.
 */
export async function getEventForServer(id: string): Promise<EventItem | null> {
  const base = getServerApiBase();
  const res = await fetch(`${base}/events/${id}`, {
    next: { revalidate: 30 },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Event fetch failed: ${res.status}`);
  }
  return res.json();
}
