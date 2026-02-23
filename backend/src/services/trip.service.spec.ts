import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource, QueryBuilder, Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { NotFoundException } from "@nestjs/common";
import { TripService } from "./trip.service";
import { Trip } from "../entities/trip.entity";
import { Ping } from "../entities/ping.entity";
import { ActiveTrip } from "../entities/active-trip.entity";
import { PingDto } from "../dto/trip.dto";

function makeActiveTripRepo(overrides = {}): Partial<Repository<ActiveTrip>> {
  return {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeTripRepo(overrides = {}): Partial<Repository<Trip>> {
  return {
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockResolvedValue([]),
    createQueryBuilder: jest.fn(),
    ...overrides,
  };
}

function makePingRepo(overrides = {}): Partial<Repository<Ping>> {
  return {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function makeDataSource(overrides = {}): Partial<DataSource> {
  return {
    transaction: jest.fn(),
    ...overrides,
  };
}

function makePingDto(overrides: Partial<PingDto> = {}): PingDto {
  return {
    licencePlate: "ABC-123",
    timestamp: 1000,
    latitude: 0,
    longitude: 0,
    speed: 60,
    odometer: 100,
    ...overrides,
  };
}

function makeActiveTrip(overrides = {}): ActiveTrip {
  return {
    id: 1,
    licencePlate: "ABC-123",
    startTimestamp: 0,
    startLatitude: 0,
    startLongitude: 0,
    startOdometer: 0,
    lastTimestamp: 500,
    lastLatitude: 0,
    lastLongitude: 0,
    lastOdometer: 50,
    maxSpeed: 80,
    ...overrides,
  } as ActiveTrip;
}

async function createService(
  activeTripRepoOverrides = {},
  tripRepoOverrides = {},
  pingRepoOverrides = {},
  dataSourceOverrides = {},
): Promise<{
  service: TripService;
  activeTripRepo: jest.Mocked<Repository<ActiveTrip>>;
  tripRepo: jest.Mocked<Repository<Trip>>;
  pingRepo: jest.Mocked<Repository<Ping>>;
  dataSource: jest.Mocked<DataSource>;
  eventEmitter: jest.Mocked<EventEmitter2>;
}> {
  const activeTripRepo = makeActiveTripRepo(activeTripRepoOverrides);
  const tripRepo = makeTripRepo(tripRepoOverrides);
  const pingRepo = makePingRepo(pingRepoOverrides);
  const dataSource = makeDataSource(dataSourceOverrides);
  const eventEmitter = {
    emit: jest.fn(),
  } as unknown as jest.Mocked<EventEmitter2>;

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      TripService,
      { provide: getRepositoryToken(Trip), useValue: tripRepo },
      { provide: getRepositoryToken(Ping), useValue: pingRepo },
      { provide: getRepositoryToken(ActiveTrip), useValue: activeTripRepo },
      { provide: EventEmitter2, useValue: eventEmitter },
      { provide: DataSource, useValue: dataSource },
    ],
  }).compile();

  return {
    service: module.get<TripService>(TripService),
    activeTripRepo: activeTripRepo as jest.Mocked<Repository<ActiveTrip>>,
    tripRepo: tripRepo as jest.Mocked<Repository<Trip>>,
    pingRepo: pingRepo as jest.Mocked<Repository<Ping>>,
    dataSource: dataSource as jest.Mocked<DataSource>,
    eventEmitter,
  };
}

function makeTrip(overrides = {}): Trip {
  return {
    id: 1,
    licencePlate: "ABC-123",
    startTimestamp: 0,
    endTimestamp: 500,
    startLatitude: 0,
    startLongitude: 0,
    endLatitude: 1,
    endLongitude: 1,
    totalDistance: 50,
    durationSeconds: 500,
    avgSpeed: 36,
    maxSpeed: 80,
    ...overrides,
  } as unknown as Trip;
}

describe("TripService", () => {
  describe("processPing", () => {
    describe("no active trip", () => {
      it("should start a new trip when speed >= MIN_SPEED (5)", async () => {
        const { service, activeTripRepo } = await createService();
        const dto = makePingDto({ speed: 10 });

        await service.processPing(dto);

        expect(activeTripRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({ licencePlate: dto.licencePlate }),
        );
        expect(activeTripRepo.save).toHaveBeenCalled();
      });

      it("should NOT start a trip when speed < MIN_SPEED", async () => {
        const { service, activeTripRepo } = await createService();

        await service.processPing(makePingDto({ speed: 3 }));

        expect(activeTripRepo.save).not.toHaveBeenCalled();
      });

      it("should record a ping regardless of speed", async () => {
        const { service, pingRepo } = await createService();

        await service.processPing(makePingDto({ speed: 0 }));

        expect(pingRepo.save).toHaveBeenCalledTimes(1);
      });

      it("should emit ping.received event", async () => {
        const { service, eventEmitter } = await createService();
        const dto = makePingDto();

        await service.processPing(dto);

        expect(eventEmitter.emit).toHaveBeenCalledWith("ping.received", dto);
      });
    });

    describe("existing active trip – no close condition", () => {
      it("should update the active trip and record one ping", async () => {
        const active = makeActiveTrip({
          lastTimestamp: 950,
          lastOdometer: 99.8,
        });
        const { service, activeTripRepo, pingRepo } = await createService({
          findOne: jest.fn().mockResolvedValue(active),
        });
        const dto = makePingDto({ timestamp: 1000, speed: 60, odometer: 100 });

        await service.processPing(dto);

        expect(activeTripRepo.save).toHaveBeenCalledWith(
          expect.objectContaining({ lastTimestamp: 1000 }),
        );
        expect(pingRepo.save).toHaveBeenCalledTimes(1);
      });

      it("should update maxSpeed when incoming speed is higher", async () => {
        const active = makeActiveTrip({
          lastTimestamp: 950,
          lastOdometer: 99.8,
          maxSpeed: 60,
        });
        const { service, activeTripRepo } = await createService({
          findOne: jest.fn().mockResolvedValue(active),
        });

        await service.processPing(
          makePingDto({ timestamp: 1000, speed: 120, odometer: 100 }),
        );

        expect(activeTripRepo.save).toHaveBeenCalledWith(
          expect.objectContaining({ maxSpeed: 120 }),
        );
      });

      it("should NOT update maxSpeed when incoming speed is lower", async () => {
        const active = makeActiveTrip({
          lastTimestamp: 950,
          lastOdometer: 99.8,
          maxSpeed: 100,
        });
        const { service, activeTripRepo } = await createService({
          findOne: jest.fn().mockResolvedValue(active),
        });

        await service.processPing(
          makePingDto({ timestamp: 1000, speed: 60, odometer: 100 }),
        );

        expect(activeTripRepo.save).toHaveBeenCalledWith(
          expect.objectContaining({ maxSpeed: 100 }),
        );
      });
    });

    describe("existing active trip – close condition met", () => {
      it("should close trip on idle timeout (idleTime > 300 s)", async () => {
        const active = makeActiveTrip({
          startTimestamp: 0,
          lastTimestamp: 100,
          lastOdometer: 10,
        });
        const { service, dataSource } = await createService({
          findOne: jest.fn().mockResolvedValue(active),
        });

        await service.processPing(
          makePingDto({ timestamp: 800, speed: 60, odometer: 60 }),
        );

        expect(dataSource.transaction).toHaveBeenCalled();
      });

      it("should close trip when vehicle is stopped AND stationary (speed < 5 and displacement < 0.3)", async () => {
        const active = makeActiveTrip({
          startTimestamp: 0,
          lastTimestamp: 100,
          lastOdometer: 50,
        });
        const { service, dataSource } = await createService({
          findOne: jest.fn().mockResolvedValue(active),
        });

        await service.processPing(
          makePingDto({ timestamp: 200, speed: 2, odometer: 50.1 }),
        );

        expect(dataSource.transaction).toHaveBeenCalled();
      });

      it("should NOT close trip when stopped but still displacing (odometer delta >= 0.3)", async () => {
        const active = makeActiveTrip({ lastTimestamp: 950, lastOdometer: 99 });
        const { service, dataSource } = await createService({
          findOne: jest.fn().mockResolvedValue(active),
        });

        await service.processPing(
          makePingDto({ timestamp: 1000, speed: 2, odometer: 99.5 }),
        );

        expect(dataSource.transaction).not.toHaveBeenCalled();
      });

      it("should NOT close trip when stationary but still moving fast (speed >= 5)", async () => {
        const active = makeActiveTrip({
          lastTimestamp: 950,
          lastOdometer: 100,
        });
        const { service, dataSource } = await createService({
          findOne: jest.fn().mockResolvedValue(active),
        });

        await service.processPing(
          makePingDto({ timestamp: 1000, speed: 10, odometer: 100.1 }),
        );

        expect(dataSource.transaction).not.toHaveBeenCalled();
      });

      it("should discard trip when duration < MIN_DURATION (60 s)", async () => {
        const active = makeActiveTrip({
          startTimestamp: 0,
          lastTimestamp: 50,
          lastOdometer: 5,
        });
        const { service, activeTripRepo, dataSource } = await createService({
          findOne: jest.fn().mockResolvedValue(active),
        });

        await service.processPing(
          makePingDto({ timestamp: 59, speed: 0, odometer: 5.25 }),
        );

        expect(activeTripRepo.remove).toHaveBeenCalledWith(active);
        expect(dataSource.transaction).not.toHaveBeenCalled();
      });

      it("should emit trip.completed after a valid trip is saved", async () => {
        const active = makeActiveTrip({
          startTimestamp: 0,
          lastTimestamp: 200,
          lastOdometer: 20,
        });
        const { service, eventEmitter } = await createService(
          {
            findOne: jest.fn().mockResolvedValue(active),
          },
          {},
          {},
          {
            transaction: jest.fn().mockImplementation((callback) => {
              return callback({
                create: jest.fn().mockImplementation((entity, data) => ({
                  id: 1,
                  ...data,
                })),
                save: jest.fn().mockResolvedValue({ id: 1 }),
                createQueryBuilder: jest.fn().mockReturnValue({
                  update: jest.fn().mockReturnThis(),
                  set: jest.fn().mockReturnThis(),
                  where: jest.fn().mockReturnThis(),
                  andWhere: jest.fn().mockReturnThis(),
                  execute: jest.fn(),
                }),
                remove: jest.fn(),
              });
            }),
          },
        );

        const dto = makePingDto({ timestamp: 1000, speed: 4, odometer: 20.2 });

        await service.processPing(dto);

        expect(eventEmitter.emit).toHaveBeenCalledWith(
          "trip.completed",
          expect.any(Object),
        );
      });

      it("should return early after closing (no second ping recorded at the end)", async () => {
        const active = makeActiveTrip({
          startTimestamp: 0,
          lastTimestamp: 200,
          lastOdometer: 20,
        });
        const { service, pingRepo } = await createService({
          findOne: jest.fn().mockResolvedValue(active),
        });

        await service.processPing(
          makePingDto({ timestamp: 800, speed: 60, odometer: 80 }),
        );

        expect(pingRepo.save).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("shouldCloseTrip boundary conditions", () => {
    it("should NOT close at exactly 300 s idle (boundary is strictly >)", async () => {
      const active = makeActiveTrip({ lastTimestamp: 700, lastOdometer: 99.8 });
      const { service, dataSource } = await createService({
        findOne: jest.fn().mockResolvedValue(active),
      });

      await service.processPing(
        makePingDto({ timestamp: 1000, speed: 60, odometer: 100 }),
      );

      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it("should close at 301 s idle", async () => {
      const active = makeActiveTrip({
        startTimestamp: 0,
        lastTimestamp: 699,
        lastOdometer: 10,
      });
      const { service, dataSource } = await createService({
        findOne: jest.fn().mockResolvedValue(active),
      });

      await service.processPing(
        makePingDto({ timestamp: 1000, speed: 60, odometer: 60 }),
      );

      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it("should NOT close when odometer displacement is exactly MIN_DISPLACEMENT (0.3)", async () => {
      const active = makeActiveTrip({ lastTimestamp: 950, lastOdometer: 100 });
      const { service, dataSource } = await createService({
        findOne: jest.fn().mockResolvedValue(active),
      });

      await service.processPing(
        makePingDto({ timestamp: 1000, speed: 2, odometer: 100.3 }),
      );

      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it("should close when displacement is below MIN_DISPLACEMENT (0.29)", async () => {
      const active = makeActiveTrip({
        startTimestamp: 0,
        lastTimestamp: 100,
        lastOdometer: 100,
      });
      const { service, dataSource } = await createService({
        findOne: jest.fn().mockResolvedValue(active),
      });

      await service.processPing(
        makePingDto({ timestamp: 200, speed: 2, odometer: 100.29 }),
      );

      expect(dataSource.transaction).toHaveBeenCalled();
    });
  });

  describe("listTrips", () => {
    function makeMockQb(trips: Trip[], total: number) {
      return {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([trips, total]),
      };
    }

    it("should return paginated trips with default page/pageSize", async () => {
      const trips = [makeTrip({ id: 1 }), makeTrip({ id: 2 })];
      const mockQb = makeMockQb(trips, 2);
      const { service } = await createService(
        {},
        { createQueryBuilder: jest.fn().mockReturnValue(mockQb) },
      );

      const result = await service.listTrips({});

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(1);
      expect(result.trips).toHaveLength(2);
    });

    it("should map numeric fields to numbers in the response", async () => {
      const trip = makeTrip({
        startTimestamp: "1000" as any,
        totalDistance: "50.5" as any,
      });
      const mockQb = makeMockQb([trip], 1);
      const { service } = await createService(
        {},
        { createQueryBuilder: jest.fn().mockReturnValue(mockQb) },
      );

      const result = await service.listTrips({});

      expect(typeof result.trips[0].startTimestamp).toBe("number");
      expect(typeof result.trips[0].totalDistance).toBe("number");
    });

    it("should apply licencePlate, startFrom and startTo filters", async () => {
      const mockQb = makeMockQb([], 0);
      const { service } = await createService(
        {},
        { createQueryBuilder: jest.fn().mockReturnValue(mockQb) },
      );

      await service.listTrips({
        licencePlate: "ABC",
        startFrom: 100,
        startTo: 200,
      });

      expect(mockQb.andWhere).toHaveBeenCalledTimes(3);
    });

    it("should calculate totalPages correctly with ceiling division", async () => {
      const mockQb = makeMockQb([], 25);
      const { service } = await createService(
        {},
        { createQueryBuilder: jest.fn().mockReturnValue(mockQb) },
      );

      const result = await service.listTrips({ page: 1, pageSize: 10 });

      expect(result.totalPages).toBe(3);
    });

    it("should skip the correct number of records based on page", async () => {
      const mockQb = makeMockQb([], 0);
      const { service } = await createService(
        {},
        { createQueryBuilder: jest.fn().mockReturnValue(mockQb) },
      );

      await service.listTrips({ page: 3, pageSize: 10 });

      expect(mockQb.skip).toHaveBeenCalledWith(20);
    });
  });

  describe("getTripDetails", () => {
    it("should return trip with associated pings", async () => {
      const trip = makeTrip();
      const pings = [
        {
          id: 1,
          tripId: 1,
          timestamp: "100" as any,
          latitude: "0" as any,
          longitude: "0" as any,
          speed: "60" as any,
          odometer: "10" as any,
        },
      ] as unknown as Ping[];

      const { service } = await createService(
        {},
        { findOne: jest.fn().mockResolvedValue(trip) },
        { find: jest.fn().mockResolvedValue(pings) },
      );

      const result = await service.getTripDetails(1);

      expect(result.pings).toHaveLength(1);
    });

    it("should map ping numeric fields to numbers", async () => {
      const trip = makeTrip();
      const pings = [
        {
          id: 1,
          tripId: 1,
          timestamp: "100" as any,
          latitude: "-23.5" as any,
          longitude: "-46.6" as any,
          speed: "60" as any,
          odometer: "10.5" as any,
        },
      ] as unknown as Ping[];

      const { service } = await createService(
        {},
        { findOne: jest.fn().mockResolvedValue(trip) },
        { find: jest.fn().mockResolvedValue(pings) },
      );

      const result = await service.getTripDetails(1);
      const ping = result.pings[0];

      expect(typeof ping.timestamp).toBe("number");
      expect(typeof ping.latitude).toBe("number");
      expect(typeof ping.speed).toBe("number");
      expect(typeof ping.odometer).toBe("number");
    });

    it("should map trip numeric fields to numbers", async () => {
      const trip = makeTrip({
        startTimestamp: "0" as any,
        totalDistance: "50.5" as any,
        avgSpeed: "36.0" as any,
      });

      const { service } = await createService(
        {},
        { findOne: jest.fn().mockResolvedValue(trip) },
        { find: jest.fn().mockResolvedValue([]) },
      );

      const result = await service.getTripDetails(1);

      expect(typeof result.startTimestamp).toBe("number");
      expect(typeof result.totalDistance).toBe("number");
      expect(typeof result.avgSpeed).toBe("number");
    });

    it("should throw NotFoundException when trip does not exist", async () => {
      const { service } = await createService(
        {},
        { findOne: jest.fn().mockResolvedValue(null) },
      );

      await expect(service.getTripDetails(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException with the correct trip ID in the message", async () => {
      const { service } = await createService(
        {},
        { findOne: jest.fn().mockResolvedValue(null) },
      );

      await expect(service.getTripDetails(999)).rejects.toThrow(
        "Trip with ID 999 not found",
      );
    });
  });

  describe("getMotorcycleStats", () => {
    it("should return zero stats when no trips found", async () => {
      const { service } = await createService(
        {},
        { find: jest.fn().mockResolvedValue([]) },
      );

      const result = await service.getMotorcycleStats("ABC-123");

      expect(result).toEqual({
        licencePlate: "ABC-123",
        totalTrips: 0,
        totalDistance: 0,
        totalDuration: 0,
        avgTripDistance: 0,
        avgTripDuration: 0,
      });
    });

    it("should compute aggregated stats from multiple trips", async () => {
      const trips = [
        { totalDistance: 100, durationSeconds: 3600 },
        { totalDistance: 200, durationSeconds: 7200 },
      ] as Trip[];

      const { service } = await createService(
        {},
        { find: jest.fn().mockResolvedValue(trips) },
      );

      const result = await service.getMotorcycleStats("ABC-123");

      expect(result.totalTrips).toBe(2);
      expect(result.totalDistance).toBe(300);
      expect(result.totalDuration).toBe(10800);
      expect(result.avgTripDistance).toBe(150);
      expect(result.avgTripDuration).toBe(5400);
    });

    it("should handle a single trip correctly", async () => {
      const trips = [{ totalDistance: 50, durationSeconds: 1800 }] as Trip[];

      const { service } = await createService(
        {},
        { find: jest.fn().mockResolvedValue(trips) },
      );

      const result = await service.getMotorcycleStats("XYZ-999");

      expect(result.totalTrips).toBe(1);
      expect(result.avgTripDistance).toBe(50);
      expect(result.avgTripDuration).toBe(1800);
    });

    it("should coerce totalDistance from string to number when computing sum", async () => {
      const trips = [
        { totalDistance: "100.5" as any, durationSeconds: 1000 },
        { totalDistance: "200.5" as any, durationSeconds: 2000 },
      ] as Trip[];

      const { service } = await createService(
        {},
        { find: jest.fn().mockResolvedValue(trips) },
      );

      const result = await service.getMotorcycleStats("ABC-123");

      expect(result.totalDistance).toBeCloseTo(301);
    });
  });
});
