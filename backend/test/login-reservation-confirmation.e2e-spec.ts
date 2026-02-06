import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../src/app.module';

describe('Connexion -> Réservation -> Confirmation (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;

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
    process.env.JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'e2e-test-secret';

    const { AppModule } = require('../src/app.module');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
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
  }, 30000);

  afterAll(async () => {
    await app?.close();
    await mongod?.stop();
  });

  it('full flow: register -> login -> create event -> publish -> reserve -> admin confirm', async () => {
    const server = app.getHttpServer();

    await request(server).post('/auth/register').send(admin).expect(201);
    const adminLogin = await request(server)
      .post('/auth/login')
      .send({ email: admin.email, password: admin.password })
      .expect(201);
    const adminToken = adminLogin.body.access_token;

    await request(server).post('/auth/register').send(participant).expect(201);
    const participantLogin = await request(server)
      .post('/auth/login')
      .send({ email: participant.email, password: participant.password })
      .expect(201);
    const participantToken = participantLogin.body.access_token;

    const eventRes = await request(server)
      .post('/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(eventDto)
      .expect(201);
    const eventId = eventRes.body._id;

    await request(server)
      .post(`/events/${eventId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const reservationRes = await request(server)
      .post('/reservations')
      .set('Authorization', `Bearer ${participantToken}`)
      .send({ eventId })
      .expect(201);
    expect(reservationRes.body.status).toBe('PENDING');

    const confirmRes = await request(server)
      .post(`/reservations/${reservationRes.body._id}/admin/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    expect(confirmRes.body.status).toBe('CONFIRMED');

    const meRes = await request(server)
      .get('/reservations/me')
      .set('Authorization', `Bearer ${participantToken}`)
      .expect(200);
    expect(meRes.body).toHaveLength(1);
    expect(meRes.body[0].status).toBe('CONFIRMED');
  });
});
