'use client';

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ReservationsPage from './page';
import { ReduxWrapper, createTestStore } from '@/app/test-utils';
import { reservationsService } from '@/lib/api/services/reservations.service';
import type { ReservationItem } from '@/lib/api/types';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api/services/reservations.service', () => ({
  reservationsService: {
    findMyReservations: jest.fn(),
    cancel: jest.fn(),
    downloadTicketPdf: jest.fn(),
  },
}));

const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace, push: jest.fn(), refresh: jest.fn() };

const mockReservation = (overrides: Partial<ReservationItem> = {}): ReservationItem => ({
  _id: 'res-1',
  event: {
    _id: 'ev-1',
    title: 'Concert Jazz',
    dateTime: '2026-06-15T20:00:00.000Z',
    location: 'Paris',
    capacity: 50,
    reservedCount: 10,
    status: 'PUBLISHED',
    description: '',
  },
  user: 'user-1',
  status: 'PENDING',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

function renderReservationsPage(authenticated: boolean) {
  const store = createTestStore(
    authenticated
      ? {
          auth: {
            isAuthenticated: true,
            user: { userId: 'u1', email: 'u@test.com', role: 'PARTICIPANT' },
            accessToken: 'token',
          },
        }
      : undefined,
  );
  return render(
    <ReduxWrapper store={store}>
      <ReservationsPage />
    </ReduxWrapper>,
  );
}

describe('ReservationsPage', () => {
  beforeEach(() => {
    jest.mocked(useRouter).mockReturnValue(mockRouter as ReturnType<typeof useRouter>);
    mockReplace.mockClear();
    jest.mocked(reservationsService.findMyReservations).mockReset();
    jest.mocked(reservationsService.cancel).mockReset();
  });

  it('redirects to login when not authenticated', async () => {
    renderReservationsPage(false);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login?redirect=/reservations');
    });
  });

  it('shows title and loading then list when authenticated', async () => {
    jest.mocked(reservationsService.findMyReservations).mockResolvedValue([
      mockReservation({ _id: 'r1', status: 'PENDING' }),
    ]);
    renderReservationsPage(true);

    expect(screen.getByRole('heading', { name: /mes réservations/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(reservationsService.findMyReservations).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText(/Concert Jazz/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/En attente/i)).toBeInTheDocument();
  });

  it('shows empty message when no reservations', async () => {
    jest.mocked(reservationsService.findMyReservations).mockResolvedValue([]);
    renderReservationsPage(true);

    await waitFor(() => {
      expect(screen.getByText(/Vous n'avez aucune réservation/i)).toBeInTheDocument();
    });
  });

  it('clicking Rafraîchir refetches reservations', async () => {
    jest.mocked(reservationsService.findMyReservations).mockResolvedValue([]);
    renderReservationsPage(true);

    await waitFor(() => {
      expect(screen.getByText(/Vous n'avez aucune réservation/i)).toBeInTheDocument();
    });
    const refreshBtn = screen.getByRole('button', { name: /rafraîchir/i });
    expect(refreshBtn).not.toBeDisabled();
    fireEvent.click(refreshBtn);
    await waitFor(() => {
      expect(reservationsService.findMyReservations).toHaveBeenCalledTimes(2);
    });
  });

  it('clicking Annuler calls cancel and updates list', async () => {
    jest.mocked(reservationsService.findMyReservations).mockResolvedValue([
      mockReservation({ _id: 'r1', status: 'PENDING' }),
    ]);
    jest.mocked(reservationsService.cancel).mockResolvedValue(
      mockReservation({ _id: 'r1', status: 'CANCELLED' }) as never,
    );
    renderReservationsPage(true);

    await waitFor(() => {
      expect(screen.getByText(/Concert Jazz/i)).toBeInTheDocument();
    });
    const cancelBtn = screen.getByRole('button', { name: /annuler la réservation/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(reservationsService.cancel).toHaveBeenCalledWith('r1');
    });
    await waitFor(() => {
      expect(reservationsService.findMyReservations).toHaveBeenCalledTimes(2);
    });
  });
});
