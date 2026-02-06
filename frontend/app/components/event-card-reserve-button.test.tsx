'use client';

import { render, screen } from '@testing-library/react';
import EventCardReserveButton from './event-card-reserve-button';
import { ReduxWrapper, createTestStore } from '@/app/test-utils';

jest.mock('next/link', () => {
  function MockLink(props: { children: React.ReactNode; href: string }) {
    return <a href={props.href}>{props.children}</a>;
  }
  return MockLink;
});

function renderButton(
  props: { eventId: string; full: boolean; hasReserved?: boolean; cancelled?: boolean },
  authenticated: boolean,
) {
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
      <EventCardReserveButton {...props} />
    </ReduxWrapper>,
  );
}

describe('EventCardReserveButton', () => {
  it('shows "Annulé" when event is cancelled', () => {
    renderButton({ eventId: 'ev-1', full: false, cancelled: true }, true);
    expect(screen.getByText(/Annulé/i)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows "Complet" when event is full', () => {
    renderButton({ eventId: 'ev-1', full: true, cancelled: false }, true);
    expect(screen.getByText(/Complet/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /réserver/i })).not.toBeInTheDocument();
  });

  it('shows "Réservé" when authenticated and already reserved', () => {
    renderButton({ eventId: 'ev-1', full: false, hasReserved: true, cancelled: false }, true);
    expect(screen.getByText(/Réservé/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /réserver/i })).not.toBeInTheDocument();
  });

  it('shows link "Réserver" to event when authenticated and can reserve', () => {
    renderButton({ eventId: 'ev-1', full: false, hasReserved: false, cancelled: false }, true);
    const link = screen.getByRole('link', { name: /réserver/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/events/ev-1');
  });

  it('shows link "Connectez-vous pour réserver" when not authenticated', () => {
    renderButton({ eventId: 'ev-1', full: false, hasReserved: false, cancelled: false }, false);
    const link = screen.getByRole('link', { name: /connectez-vous pour réserver/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
  });
});
