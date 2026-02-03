'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, type AppStore } from '@/lib/store';

/**
 * Client-only Redux Provider.
 * Creates the store once per client (useRef) so state is preserved across navigations
 * and not shared between users/requests.
 */
export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
