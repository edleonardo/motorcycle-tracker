import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Trip } from '../src/entities/trip.entity';
import { Ping } from '../src/entities/ping.entity';
import { ActiveTrip } from '../src/entities/active-trip.entity';

describe('TripController (e2e)', () => {
  let app: INestApplication;
  let tripRepository;
  let pingRepository;
  let activeTripRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    tripRepository = moduleFixture.get(getRepositoryToken(Trip));
    pingRepository = moduleFixture.get(getRepositoryToken(Ping));
    activeTripRepository = moduleFixture.get(getRepositoryToken(ActiveTrip));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await pingRepository.delete({});
    await tripRepository.delete({});
    await activeTripRepository.delete({});
  });

  describe('/api/trips/pings (POST)', () => {
    it('should accept a valid ping', () => {
      return request(app.getHttpServer())
        .post('/api/trips/pings')
        .send({
          licencePlate: 'ABC-1234',
          timestamp: 1706400000,
          latitude: -23.5505,
          longitude: -46.6333,
          speed: 30,
          odometer: 1000,
        })
        .expect(202)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should reject ping with invalid data', () => {
      return request(app.getHttpServer())
        .post('/api/trips/pings')
        .send({
          licencePlate: 'ABC-1234',
          timestamp: -1,
          latitude: 100, 
          longitude: -46.6333,
          speed: 30,
          odometer: 1000,
        })
        .expect(400);
    });

    it('should reject ping with missing fields', () => {
      return request(app.getHttpServer())
        .post('/api/trips/pings')
        .send({
          licencePlate: 'ABC-1234',
          timestamp: 1706400000,
        })
        .expect(400);
    });
  });

  describe('/api/trips (GET)', () => {
    it('should return empty list when no trips exist', () => {
      return request(app.getHttpServer())
        .get('/api/trips')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('trips', []);
          expect(res.body).toHaveProperty('total', 0);
        });
    });

    it('should support pagination parameters', () => {
      return request(app.getHttpServer())
        .get('/api/trips?page=1&pageSize=5')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('page', 1);
          expect(res.body).toHaveProperty('pageSize', 5);
        });
    });

    it('should support license plate filter', () => {
      return request(app.getHttpServer())
        .get('/api/trips?licencePlate=ABC-1234')
        .expect(200);
    });

    it('should support timestamp filters', () => {
      return request(app.getHttpServer())
        .get('/api/trips?startFrom=1706400000&startTo=1706500000')
        .expect(200);
    });
  });

  describe('/api/trips/:id (GET)', () => {
    it('should return 404 for non-existent trip', () => {
      return request(app.getHttpServer())
        .get('/api/trips/999')
        .expect(404);
    });

    it('should return trip details with pings', async () => {
      const trip = await tripRepository.save({
        licencePlate: 'ABC-1234',
        startTimestamp: 1706400000,
        endTimestamp: 1706401000,
        startLatitude: -23.5505,
        startLongitude: -46.6333,
        endLatitude: -23.5507,
        endLongitude: -46.6335,
        totalDistance: 5.5,
        durationSeconds: 1000,
        avgSpeed: 19.8,
        maxSpeed: 35,
      });

      await pingRepository.save([
        {
          tripId: trip.id,
          licencePlate: 'ABC-1234',
          timestamp: 1706400000,
          latitude: -23.5505,
          longitude: -46.6333,
          speed: 30,
          odometer: 1000,
        },
        {
          tripId: trip.id,
          licencePlate: 'ABC-1234',
          timestamp: 1706400500,
          latitude: -23.5506,
          longitude: -46.6334,
          speed: 35,
          odometer: 1003,
        },
      ]);

      return request(app.getHttpServer())
        .get(`/api/trips/${trip.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', trip.id);
          expect(res.body).toHaveProperty('licencePlate', 'ABC-1234');
          expect(res.body).toHaveProperty('pings');
          expect(res.body.pings).toHaveLength(2);
        });
    });
  });

  describe('/api/trips/stats/:licencePlate (GET)', () => {
    it('should return statistics for a motorcycle', () => {
      return request(app.getHttpServer())
        .get('/api/trips/stats/ABC-1234')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('licencePlate', 'ABC-1234');
          expect(res.body).toHaveProperty('totalTrips');
          expect(res.body).toHaveProperty('totalDistance');
        });
    });
  });

  describe('Trip completion flow (integration)', () => {
    it('should create and complete a trip through multiple pings', async () => {
      const baseTime = Math.floor(Date.now() / 1000);
      
      await request(app.getHttpServer())
        .post('/api/trips/pings')
        .send({
          licencePlate: 'TEST-001',
          timestamp: baseTime,
          latitude: -23.5505,
          longitude: -46.6333,
          speed: 40,
          odometer: 1000,
        })
        .expect(202);

      await request(app.getHttpServer())
        .post('/api/trips/pings')
        .send({
          licencePlate: 'TEST-001',
          timestamp: baseTime + 100,
          latitude: -23.5510,
          longitude: -46.6340,
          speed: 50,
          odometer: 1002,
        })
        .expect(202);

      await request(app.getHttpServer())
        .post('/api/trips/pings')
        .send({
          licencePlate: 'TEST-001',
          timestamp: baseTime + 400,
          latitude: -23.5510,
          longitude: -46.6340,
          speed: 0,
          odometer: 1002,
        })
        .expect(202);

      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app.getHttpServer())
        .get('/api/trips?licencePlate=TEST-001')
        .expect(200);

      expect(response.body.total).toBeGreaterThan(0);
    });
  });
});
