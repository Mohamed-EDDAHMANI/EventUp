import React, { type ReactElement } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/lib/slices/auth-slice';
import eventsReducer from '@/lib/slices/events-slice';
import type { AuthState } from '@/lib/slices/auth-slice';

const defaultAuth: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
};

export function createTestStore(overrides?: { auth?: Partial<AuthState> }) {
  const auth: AuthState = {
    ...defaultAuth,
    ...overrides?.auth,
  };
  return configureStore({
    reducer: {
      auth: authReducer,
      events: eventsReducer,
    },
    preloadedState: { auth },
  });
}

export function ReduxWrapper({
  children,
  store,
}: {
  children: React.ReactNode;
  store: ReturnType<typeof createTestStore>;
}) {
  return <Provider store={store}>{children}</Provider>;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: { auth?: Partial<AuthState> },
) {
  const store = createTestStore(options);
  return { store, wrapper: ({ children }: { children: React.ReactNode }) => ReduxWrapper({ children, store }) };
}
