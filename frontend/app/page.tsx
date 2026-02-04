import { getEventsForServer } from '@/lib/api/server';
import HomePageView from './components/home-page-view';

export default async function HomePage() {
  let initialEvents: Awaited<ReturnType<typeof getEventsForServer>> = [];
  let eventsError: string | null = null;
  try {
    initialEvents = await getEventsForServer();
  } catch (e) {
    eventsError = e instanceof Error ? e.message : 'Erreur lors du chargement des événements';
  }

  return (
    <HomePageView initialEvents={initialEvents} eventsError={eventsError} />
  );
}
