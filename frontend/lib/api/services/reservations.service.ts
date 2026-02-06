import { api } from '@/lib/api/axios';
import type {
  ReservationItem,
  CreateReservationPayload,
  UpdateReservationPayload,
} from '@/lib/api/types';

const RESERVATIONS_BASE = '/reservations';

export const reservationsService = {
  /** Create a reservation for an event (authenticated). */
  create(payload: CreateReservationPayload): Promise<ReservationItem> {
    return api.post<ReservationItem>(RESERVATIONS_BASE, payload).then((r) => r.data);
  },

  /** Get current user's reservations. */
  findMyReservations(): Promise<ReservationItem[]> {
    return api.get<ReservationItem[]>(`${RESERVATIONS_BASE}/me`).then((r) => r.data);
  },

  /** Get one reservation by id (own only). */
  findOne(id: string): Promise<ReservationItem> {
    return api.get<ReservationItem>(`${RESERVATIONS_BASE}/${id}`).then((r) => r.data);
  },

  /**
   * Télécharge le billet PDF (réservation confirmée uniquement).
   * eventTitle optionnel : si fourni, utilisé pour le nom du fichier (sinon lecture du header Content-Disposition).
   */
  async downloadTicketPdf(id: string, eventTitle?: string): Promise<void> {
    const res = await api.get<Blob>(`${RESERVATIONS_BASE}/ticket/${id}`, {
      responseType: 'blob',
    });
    let filename = `billet-eventup-${id}.pdf`;
    if (eventTitle?.trim()) {
      const safe = eventTitle
        .replace(/[/\\:*?"<>|]/g, '-')
        .replace(/\s+/g, '-')
        .slice(0, 100)
        .trim();
      if (safe) filename = `billet-${safe}.pdf`;
    } else {
      const disposition = res.headers['content-disposition'];
      if (typeof disposition === 'string') {
        const matchUtf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i);
        const match = disposition.match(/filename=["']?([^"';]+)["']?/i);
        if (matchUtf8) {
          try {
            filename = decodeURIComponent(matchUtf8[1].trim());
          } catch {
            // keep default
          }
        } else if (match) {
          filename = match[1].trim();
        }
      }
    }
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  /** Confirm a PENDING reservation. */
  confirm(id: string): Promise<ReservationItem> {
    return api.post<ReservationItem>(`${RESERVATIONS_BASE}/${id}/confirm`).then((r) => r.data);
  },

  /** Cancel a reservation. */
  cancel(id: string): Promise<ReservationItem> {
    return api.post<ReservationItem>(`${RESERVATIONS_BASE}/${id}/cancel`).then((r) => r.data);
  },

  /** Update reservation (e.g. status). */
  update(id: string, payload: UpdateReservationPayload): Promise<ReservationItem> {
    return api.patch<ReservationItem>(`${RESERVATIONS_BASE}/${id}`, payload).then((r) => r.data);
  },

  /** Admin: create a reservation for a participant. */
  adminCreate(payload: { eventId: string; userId: string }): Promise<ReservationItem> {
    return api
      .post<ReservationItem>(`${RESERVATIONS_BASE}/admin/create`, payload)
      .then((r) => r.data);
  },

  /** Admin: list all reservations. */
  findAllAdmin(): Promise<ReservationItem[]> {
    return api.get<ReservationItem[]>(`${RESERVATIONS_BASE}/admin`).then((r) => r.data);
  },

  /** Admin: list reservations by event. */
  findByEventAdmin(eventId: string): Promise<ReservationItem[]> {
    return api
      .get<ReservationItem[]>(`${RESERVATIONS_BASE}/admin/by-event/${eventId}`)
      .then((r) => r.data);
  },

  /** Admin: list reservations by participant. */
  findByParticipantAdmin(userId: string): Promise<ReservationItem[]> {
    return api
      .get<ReservationItem[]>(`${RESERVATIONS_BASE}/admin/by-participant/${userId}`)
      .then((r) => r.data);
  },

  /** Admin: confirm a reservation. */
  adminConfirm(id: string): Promise<ReservationItem> {
    return api.post<ReservationItem>(`${RESERVATIONS_BASE}/${id}/admin/confirm`).then((r) => r.data);
  },

  /** Admin: refuse a reservation. */
  adminRefuse(id: string): Promise<ReservationItem> {
    return api.post<ReservationItem>(`${RESERVATIONS_BASE}/${id}/admin/refuse`).then((r) => r.data);
  },

  /** Admin: cancel a reservation. */
  adminCancel(id: string): Promise<ReservationItem> {
    return api.post<ReservationItem>(`${RESERVATIONS_BASE}/${id}/admin/cancel`).then((r) => r.data);
  },
};
