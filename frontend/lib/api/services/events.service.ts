import { api } from '@/lib/api/axios';
import type {
  EventItem,
  CreateEventPayload,
  UpdateEventPayload,
} from '@/lib/api/types';

const EVENTS_BASE = '/events';

export const eventsService = {
  /** List published upcoming events (public). */
  async findAll(): Promise<EventItem[]> {
    const { data } = await api.get<EventItem[]>(EVENTS_BASE);
    return data;
  },

  /** List all events including drafts/cancelled (ADMIN). */
  async findAllAdmin(): Promise<EventItem[]> {
    const { data } = await api.get<EventItem[]>(`${EVENTS_BASE}/admin/all`);
    return data;
  },

  /** Get one event by id (includes remainingPlaces). */
  async findOne(id: string): Promise<EventItem> {
    const { data } = await api.get<EventItem>(`${EVENTS_BASE}/${id}`);
    return data;
  },

  /** Create event (ADMIN). */
  async create(payload: CreateEventPayload): Promise<EventItem> {
    const { data } = await api.post<EventItem>(EVENTS_BASE, payload);
    return data;
  },

  /** Update event (ADMIN). */
  async update(id: string, payload: UpdateEventPayload): Promise<EventItem> {
    const { data } = await api.patch<EventItem>(`${EVENTS_BASE}/${id}`, payload);
    return data;
  },

  /** Delete event (ADMIN, DRAFT only). */
  async remove(id: string): Promise<void> {
    await api.delete(`${EVENTS_BASE}/${id}`);
  },

  /** Publish event (ADMIN). */
  async publish(id: string): Promise<EventItem> {
    const { data } = await api.post<EventItem>(`${EVENTS_BASE}/${id}/publish`);
    return data;
  },

  /** Cancel event (ADMIN). */
  async cancel(id: string): Promise<EventItem> {
    const { data } = await api.post<EventItem>(`${EVENTS_BASE}/${id}/cancel`);
    return data;
  },
};
