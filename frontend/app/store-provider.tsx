'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import { makeStore, type AppStore } from '@/lib/store';
import { setAccessToken } from '@/lib/api';

/**
 * Client-only Redux Provider with redux-persist.
 * Auth state (user + token) is persisted to localStorage so it survives refresh.
 * After rehydration, the token is synced to the axios instance for API calls.
 */
export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore | null>(null);
  const persistorRef = useRef<ReturnType<typeof persistStore> | null>(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();
    persistorRef.current = persistStore(storeRef.current);
  }

  const store = storeRef.current;
  const persistor = persistorRef.current;

  return (
    <Provider store={store}>
      <PersistGate
        loading={null}
        persistor={persistor!}
        onBeforeLift={() => {
          const state = store.getState();
          if (state.auth.accessToken) {
            setAccessToken(state.auth.accessToken);
          }
        }}
      >
        {children}
      </PersistGate>
    </Provider>
  );
}
