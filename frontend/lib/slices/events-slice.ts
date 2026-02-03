import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { EventItem } from '@/lib/api/types';

export type { EventItem } from '@/lib/api/types';

type EventsState = {
  list: EventItem[];
  selectedId: string | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: EventsState = {
  list: [],
  selectedId: null,
  isLoading: false,
  error: null,
};

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setEvents: (state, action: PayloadAction<EventItem[]>) => {
      state.list = action.payload;
      state.error = null;
    },
    setEvent: (state, action: PayloadAction<EventItem>) => {
      const index = state.list.findIndex((e) => e._id === action.payload._id);
      if (index >= 0) {
        state.list[index] = action.payload;
      } else {
        state.list.push(action.payload);
      }
      state.error = null;
    },
    removeEvent: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter((e) => e._id !== action.payload);
      if (state.selectedId === action.payload) {
        state.selectedId = null;
      }
    },
    setSelectedEventId: (state, action: PayloadAction<string | null>) => {
      state.selectedId = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearEvents: (state) => {
      state.list = [];
      state.selectedId = null;
      state.error = null;
    },
  },
});

export const {
  setEvents,
  setEvent,
  removeEvent,
  setSelectedEventId,
  setLoading,
  setError,
  clearEvents,
} = eventsSlice.actions;

export default eventsSlice.reducer;
