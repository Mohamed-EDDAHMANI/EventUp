/**
 * Shared API request/response types aligned with the backend.
 */

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';

export type ApiUser = {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'PARTICIPANT';
  createdAt?: string;
};

/** Map backend user to Redux auth state shape (userId = _id). */
export function mapApiUserToAuthUser(
  api: ApiUser,
): {
  userId: string;
  email: string;
  role: 'ADMIN' | 'PARTICIPANT';
  firstName?: string;
  lastName?: string;
} {
  return {
    userId: api._id,
    email: api.email,
    role: api.role,
    firstName: api.firstName,
    lastName: api.lastName,
  };
}

export type AuthResponse = {
  user: ApiUser;
  access_token: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'ADMIN' | 'PARTICIPANT';
};

export type EventItem = {
  _id: string;
  title: string;
  description: string;
  dateTime: string;
  location: string;
  capacity: number;
  status: EventStatus;
  reservedCount?: number;
  remainingPlaces?: number;
  createdAt?: string;
};

export type CreateEventPayload = {
  title: string;
  description?: string;
  dateTime: string;
  location: string;
  capacity: number;
};

export type UpdateEventPayload = Partial<CreateEventPayload>;

// Reservations
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export type ReservationItem = {
  _id: string;
  event: string | EventItem;
  user: string | ApiUser;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateReservationPayload = {
  eventId: string;
};

export type UpdateReservationPayload = {
  status?: ReservationStatus;
};
