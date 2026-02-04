import { configureStore } from '@reduxjs/toolkit';
import {
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  type PersistConfig,
  type Storage,
} from 'redux-persist';
import authReducer from '@/lib/slices/auth-slice';
import eventsReducer from '@/lib/slices/events-slice';

/** No-op storage for SSR so persist config is valid when module loads on server. */
const noopStorage: Storage = {
  getItem: () => Promise.resolve(null),
  setItem: () => Promise.resolve(),
  removeItem: () => Promise.resolve(),
};

function getStorage(): Storage {
  if (typeof window === 'undefined') return noopStorage;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('redux-persist/lib/storage').default;
}

const authPersistConfig: PersistConfig<{ user: unknown; accessToken: string | null; isAuthenticated: boolean }> = {
  key: 'eventup-auth',
  storage: getStorage(),
  whitelist: ['user', 'accessToken', 'isAuthenticated'],
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

/**
 * Creates a new Redux store instance with persisted auth.
 * Called once per client in StoreProvider (useRef).
 */
const persistActions = [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER];

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      auth: persistedAuthReducer,
      events: eventsReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: persistActions,
        },
      }),
    devTools: process.env.NODE_ENV !== 'production',
  });
  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
