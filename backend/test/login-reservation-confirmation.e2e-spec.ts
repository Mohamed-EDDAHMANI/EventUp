/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

type AuthResponse = { access_token: string };
type EventResponse = { _id: string };
type ReservationResponse = { _id: string; status: string };

describe('Connexion -> Réservation -> Confirmation (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let server: ReturnType<INestApplication['getHttpServer']>;

  const admin = {
    email: 'admin@eventup.test',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'EventUP',
    role: 'ADMIN',
  };

  const participant = {
    email: 'participant@eventup.test',
    password: 'Participant123!',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'PARTICIPANT',
  };

  const eventDto = {
    title: 'Concert Jazz',
    description: 'Soirée jazz',
    dateTime: new Date(Date.now() + 86400000 * 7).toISOString(),
    location: 'Paris',
    capacity: 50,
  };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongod.getUri();
    process.env.JWT_SECRET_KEY =
      process.env.JWT_SECRET_KEY || 'e2e-test-secret';

    // Load after env is set; require needed so module sees process.env.MONGO_URI
    const { AppModule: App } = require('../src/app.module') as {
      AppModule: unknown;
    };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [App],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    server = app.getHttpServer();
  }, 30000);

  afterAll(async () => {
    await app?.close();
    await mongod?.stop();
  });

  it('full flow: register -> login -> create event -> publish -> reserve -> admin confirm', async () => {
    const req = request(server as Parameters<typeof request>[0]);

    await req.post('/auth/register').send(admin).expect(201);
    const adminLogin = await req
      .post('/auth/login')
      .send({ email: admin.email, password: admin.password })
      .expect(201);
    const adminToken = (adminLogin.body as AuthResponse).access_token;

    await req.post('/auth/register').send(participant).expect(201);
    const participantLogin = await req
      .post('/auth/login')
      .send({ email: participant.email, password: participant.password })
      .expect(201);
    const participantToken = (participantLogin.body as AuthResponse)
      .access_token;

    const eventRes = await req
      .post('/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(eventDto)
      .expect(201);
    const eventId = (eventRes.body as EventResponse)._id;

    await req
      .post(`/events/${eventId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const reservationRes = await req
      .post('/reservations')
      .set('Authorization', `Bearer ${participantToken}`)
      .send({ eventId })
      .expect(201);
    const reservationBody = reservationRes.body as ReservationResponse;
    expect(reservationBody.status).toBe('PENDING');

    const confirmRes = await req
      .post(`/reservations/${reservationBody._id}/admin/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    expect((confirmRes.body as ReservationResponse).status).toBe('CONFIRMED');

    const meRes = await req
      .get('/reservations/me')
      .set('Authorization', `Bearer ${participantToken}`)
      .expect(200);
    const meBody = meRes.body as ReservationResponse[];
    expect(meBody).toHaveLength(1);
    expect(meBody[0].status).toBe('CONFIRMED');
  });
});
