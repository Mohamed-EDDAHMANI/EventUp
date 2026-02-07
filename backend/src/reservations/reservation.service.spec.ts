import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { Reservation } from './schemas/reservation.schema';
import { EventsService } from '../events/events.service';
import { PdfTicketService } from './pdf-ticket.service';

const eventId = 'event-id';
const userId = 'user-id';
const reservationId = 'reservation-id';

const event = (overrides: Record<string, unknown> = {}) => ({
  _id: eventId,
  status: 'PUBLISHED',
  dateTime: new Date(Date.now() + 86400000),
  capacity: 10,
  reservedCount: 0,
  ...overrides,
});

const reservation = (overrides: Record<string, unknown> = {}) => ({
  _id: reservationId,
  event: eventId,
  user: userId,
  status: 'PENDING',
  ...overrides,
});

const chain = (execValue: unknown) => ({
  exec: jest.fn().mockResolvedValue(execValue),
  populate: jest.fn().mockReturnThis(),
});

describe('ReservationsService', () => {
  let service: ReservationsService;
  let reservationModel: {
    findOne: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
  };
  let eventsService: {
    findOne: jest.Mock;
    reservePlaceIfCapacity: jest.Mock;
    decrementReservedCount: jest.Mock;
  };
  let mockSave: jest.Mock;

  beforeEach(async () => {
    mockSave = jest.fn();
    const model = {
      findOne: jest.fn().mockReturnValue({ exec: jest.fn() }),
      findById: jest.fn().mockReturnValue(chain(null)),
      findByIdAndUpdate: jest.fn().mockReturnValue(chain(null)),
    };
    const ModelConstructor = jest.fn().mockImplementation((doc: unknown) => ({
      ...(doc as object),
      save: mockSave,
    }));

    eventsService = {
      findOne: jest.fn(),
      reservePlaceIfCapacity: jest.fn(),
      decrementReservedCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: getModelToken(Reservation.name),
          useValue: Object.assign(ModelConstructor, model),
        },
        { provide: EventsService, useValue: eventsService },
        {
          provide: PdfTicketService,
          useValue: {
            generateTicket: jest.fn().mockResolvedValue(Buffer.from('')),
          },
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
    reservationModel = module.get(getModelToken(Reservation.name));
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('throws if event is not PUBLISHED (DRAFT)', async () => {
      eventsService.findOne.mockResolvedValue(event({ status: 'DRAFT' }));
      await expect(service.create(eventId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws if event is not PUBLISHED (CANCELLED)', async () => {
      eventsService.findOne.mockResolvedValue(event({ status: 'CANCELLED' }));
      await expect(service.create(eventId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws if event is full', async () => {
      eventsService.findOne.mockResolvedValue(event());
      reservationModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      eventsService.reservePlaceIfCapacity.mockResolvedValue(false);
      await expect(service.create(eventId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws if participant already has active reservation', async () => {
      eventsService.findOne.mockResolvedValue(event());
      reservationModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(reservation()),
      });
      await expect(service.create(eventId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('creates with status PENDING when valid', async () => {
      eventsService.findOne.mockResolvedValue(event());
      reservationModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      eventsService.reservePlaceIfCapacity.mockResolvedValue(true);
      mockSave.mockResolvedValue(reservation({ status: 'PENDING' }));
      const result = await service.create(eventId, userId);
      expect(result.status).toBe('PENDING');
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('adminConfirm', () => {
    it('throws if reservation is not PENDING', async () => {
      reservationModel.findById.mockReturnValue(
        chain(reservation({ status: 'CONFIRMED' })),
      );
      await expect(service.adminConfirm(reservationId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('updates to CONFIRMED when valid', async () => {
      reservationModel.findById.mockReturnValue(
        chain(reservation({ status: 'PENDING' })),
      );
      reservationModel.findByIdAndUpdate.mockReturnValue(
        chain(reservation({ status: 'CONFIRMED' })),
      );
      const result = await service.adminConfirm(reservationId);
      expect(result.status).toBe('CONFIRMED');
    });
  });

  describe('adminRefuse', () => {
    it('updates to CANCELLED and decrements capacity', async () => {
      reservationModel.findById.mockReturnValue(
        chain(reservation({ status: 'PENDING' })),
      );
      reservationModel.findByIdAndUpdate.mockReturnValue(
        chain(reservation({ status: 'CANCELLED' })),
      );
      eventsService.decrementReservedCount.mockResolvedValue(undefined);
      const result = await service.adminRefuse(reservationId);
      expect(result.status).toBe('CANCELLED');
      expect(eventsService.decrementReservedCount).toHaveBeenCalledWith(
        eventId,
      );
    });
  });

  describe('cancel', () => {
    it('throws if user is not owner', async () => {
      reservationModel.findById.mockReturnValue(
        chain(reservation({ user: 'other-user-id' })),
      );
      await expect(service.cancel(reservationId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws if already CANCELLED', async () => {
      reservationModel.findById.mockReturnValue(
        chain(reservation({ status: 'CANCELLED' })),
      );
      await expect(service.cancel(reservationId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('updates to CANCELLED and decrements capacity', async () => {
      reservationModel.findById.mockReturnValue(
        chain(reservation({ status: 'PENDING', user: userId })),
      );
      reservationModel.findByIdAndUpdate.mockReturnValue(
        chain(reservation({ status: 'CANCELLED' })),
      );
      eventsService.decrementReservedCount.mockResolvedValue(undefined);
      const result = await service.cancel(reservationId, userId);
      expect(result.status).toBe('CANCELLED');
      expect(eventsService.decrementReservedCount).toHaveBeenCalledWith(
        eventId,
      );
    });
  });
});
