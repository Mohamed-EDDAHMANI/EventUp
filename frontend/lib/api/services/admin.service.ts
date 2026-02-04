import { api } from '@/lib/api/axios';

export type AdminStats = {
  upcomingEventsCount: number;
  fillRatePercent: number;
  totalCapacity: number;
  totalReserved: number;
  reservationsByStatus: { PENDING: number; CONFIRMED: number; CANCELLED: number };
};

// Stats are served under events controller (GET /events/admin/stats)
const STATS_URL = '/events/admin/stats';

export const adminService = {
  getStats(): Promise<AdminStats> {
    return api.get<AdminStats>(STATS_URL).then((r) => r.data);
  },
};
