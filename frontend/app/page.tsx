import HomePageView from './components/home-page-view';

/**
 * Home page: events are fetched client-side so they work for non-authenticated users
 * regardless of Docker/SSR network (server cannot always reach backend).
 */
export default function HomePage() {
  return <HomePageView />;
}
