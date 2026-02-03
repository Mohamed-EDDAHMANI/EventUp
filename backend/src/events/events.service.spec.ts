import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EventsService } from './events.service';
import { Event } from './schemas/event.schema';

describe('EventsService', () => {
  let service: EventsService;

  const mockEventModel = {
    find: jest.fn().mockReturnThis(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    sort: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getModelToken(Event.name),
          useValue: mockEventModel,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
