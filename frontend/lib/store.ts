import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/lib/slices/auth-slice';
import eventsReducer from '@/lib/slices/events-slice';

/**
 * Creates a new Redux store instance.
 * Called once per client in StoreProvider (useRef) to avoid sharing state between users/requests.
 */
export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      events: eventsReducer,
    },
    devTools: process.env.NODE_ENV !== 'production',
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
