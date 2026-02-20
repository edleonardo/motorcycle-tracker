import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { TripController } from "./trip.controller";
import { TripService } from "../services/trip.service";
import { KafkaProducerService } from "../services/kafka-producer.service";
import {
  PingDto,
  ListTripsQueryDto,
  PaginatedTripsDto,
  TripDetailDto,
} from "../dto/trip.dto";

const pingDto: PingDto = {
  licencePlate: "ABC-123",
  timestamp: 1000,
  latitude: -23.55,
  longitude: -46.63,
  speed: 60,
  odometer: 100,
};

const paginatedTrips: PaginatedTripsDto = {
  trips: [],
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0,
};

const tripDetail: TripDetailDto = {
  id: 1,
  licencePlate: "ABC-123",
  startTimestamp: 0,
  endTimestamp: 500,
  totalDistance: 50,
  durationSeconds: 500,
  avgSpeed: 36,
  startLatitude: -23.55,
  startLongitude: -46.63,
  endLatitude: -23.56,
  endLongitude: -46.64,
  maxSpeed: 65,
  pings: [],
};

const motorcycleStats = {
  licencePlate: "ABC-123",
  totalTrips: 3,
  totalDistance: 300,
  totalDuration: 10800,
  avgTripDistance: 100,
  avgTripDuration: 3600,
};

const mockTripService = {
  processPing: jest.fn(),
  listTrips: jest.fn(),
  getTripDetails: jest.fn(),
  getMotorcycleStats: jest.fn(),
};

const mockKafkaProducer = {
  sendPing: jest.fn(),
};

async function createController(): Promise<{
  controller: TripController;
  tripService: jest.Mocked<TripService>;
  kafkaProducer: jest.Mocked<KafkaProducerService>;
}> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [TripController],
    providers: [
      { provide: TripService, useValue: mockTripService },
      { provide: KafkaProducerService, useValue: mockKafkaProducer },
    ],
  }).compile();

  return {
    controller: module.get<TripController>(TripController),
    tripService: mockTripService as unknown as jest.Mocked<TripService>,
    kafkaProducer:
      mockKafkaProducer as unknown as jest.Mocked<KafkaProducerService>,
  };
}

describe("TripController", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("receivePing", () => {
    it("should call tripService.processPing with the provided dto", async () => {
      const { controller, tripService } = await createController();
      tripService.processPing.mockResolvedValue(undefined);

      await controller.receivePing(pingDto);

      expect(tripService.processPing).toHaveBeenCalledTimes(1);
      expect(tripService.processPing).toHaveBeenCalledWith(pingDto);
    });

    it("should return the confirmation message", async () => {
      const { controller, tripService } = await createController();
      tripService.processPing.mockResolvedValue(undefined);

      const result = await controller.receivePing(pingDto);

      expect(result).toEqual({ message: "Ping received and processed" });
    });

    it("should propagate errors thrown by tripService.processPing", async () => {
      const { controller, tripService } = await createController();
      tripService.processPing.mockRejectedValue(new Error("DB failure"));

      await expect(controller.receivePing(pingDto)).rejects.toThrow(
        "DB failure",
      );
    });
  });

  describe("sendPingToKafka", () => {
    it("should call kafkaProducer.sendPing with the provided dto", async () => {
      const { controller, kafkaProducer } = await createController();
      kafkaProducer.sendPing.mockResolvedValue(undefined);

      await controller.sendPingToKafka(pingDto);

      expect(kafkaProducer.sendPing).toHaveBeenCalledTimes(1);
      expect(kafkaProducer.sendPing).toHaveBeenCalledWith(pingDto);
    });

    it("should return the Kafka confirmation message", async () => {
      const { controller, kafkaProducer } = await createController();
      kafkaProducer.sendPing.mockResolvedValue(undefined);

      const result = await controller.sendPingToKafka(pingDto);

      expect(result).toEqual({ message: "Ping sent to Kafka queue" });
    });

    it("should propagate errors thrown by kafkaProducer.sendPing", async () => {
      const { controller, kafkaProducer } = await createController();
      kafkaProducer.sendPing.mockRejectedValue(new Error("Kafka unavailable"));

      await expect(controller.sendPingToKafka(pingDto)).rejects.toThrow(
        "Kafka unavailable",
      );
    });

    it("should NOT call tripService.processPing", async () => {
      const { controller, tripService, kafkaProducer } =
        await createController();
      kafkaProducer.sendPing.mockResolvedValue(undefined);

      await controller.sendPingToKafka(pingDto);

      expect(tripService.processPing).not.toHaveBeenCalled();
    });
  });

  describe("listTrips", () => {
    it("should call tripService.listTrips with the query object", async () => {
      const { controller, tripService } = await createController();
      const query: ListTripsQueryDto = { page: 2, pageSize: 5 };
      tripService.listTrips.mockResolvedValue(paginatedTrips);

      await controller.listTrips(query);

      expect(tripService.listTrips).toHaveBeenCalledTimes(1);
      expect(tripService.listTrips).toHaveBeenCalledWith(query);
    });

    it("should return the paginated result from the service", async () => {
      const { controller, tripService } = await createController();
      tripService.listTrips.mockResolvedValue(paginatedTrips);

      const result = await controller.listTrips({});

      expect(result).toEqual(paginatedTrips);
    });

    it("should forward optional filters (licencePlate, startFrom, startTo)", async () => {
      const { controller, tripService } = await createController();
      const query: ListTripsQueryDto = {
        licencePlate: "ABC-123",
        startFrom: 1000,
        startTo: 2000,
      };
      tripService.listTrips.mockResolvedValue(paginatedTrips);

      await controller.listTrips(query);

      expect(tripService.listTrips).toHaveBeenCalledWith(query);
    });

    it("should propagate errors thrown by tripService.listTrips", async () => {
      const { controller, tripService } = await createController();
      tripService.listTrips.mockRejectedValue(new Error("Query error"));

      await expect(controller.listTrips({})).rejects.toThrow("Query error");
    });
  });

  describe("getTripDetails", () => {
    it("should call tripService.getTripDetails with the numeric id", async () => {
      const { controller, tripService } = await createController();
      tripService.getTripDetails.mockResolvedValue(tripDetail);

      await controller.getTripDetails(1);

      expect(tripService.getTripDetails).toHaveBeenCalledTimes(1);
      expect(tripService.getTripDetails).toHaveBeenCalledWith(1);
    });

    it("should return the trip detail from the service", async () => {
      const { controller, tripService } = await createController();
      tripService.getTripDetails.mockResolvedValue(tripDetail);

      const result = await controller.getTripDetails(1);

      expect(result).toEqual(tripDetail);
    });

    it("should propagate NotFoundException when trip does not exist", async () => {
      const { controller, tripService } = await createController();
      tripService.getTripDetails.mockRejectedValue(
        new NotFoundException("Trip with ID 999 not found"),
      );

      await expect(controller.getTripDetails(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getMotorcycleStats", () => {
    it("should call tripService.getMotorcycleStats with the licence plate", async () => {
      const { controller, tripService } = await createController();
      tripService.getMotorcycleStats.mockResolvedValue(motorcycleStats);

      await controller.getMotorcycleStats("ABC-123");

      expect(tripService.getMotorcycleStats).toHaveBeenCalledTimes(1);
      expect(tripService.getMotorcycleStats).toHaveBeenCalledWith("ABC-123");
    });

    it("should return the stats from the service", async () => {
      const { controller, tripService } = await createController();
      tripService.getMotorcycleStats.mockResolvedValue(motorcycleStats);

      const result = await controller.getMotorcycleStats("ABC-123");

      expect(result).toEqual(motorcycleStats);
    });

    it("should handle licence plates with special characters", async () => {
      const { controller, tripService } = await createController();
      tripService.getMotorcycleStats.mockResolvedValue({
        ...motorcycleStats,
        licencePlate: "XY-99.9",
        totalTrips: 0,
      });

      const result = await controller.getMotorcycleStats("XY-99.9");

      expect(tripService.getMotorcycleStats).toHaveBeenCalledWith("XY-99.9");
      expect(result).toMatchObject({ licencePlate: "XY-99.9" });
    });

    it("should propagate errors thrown by tripService.getMotorcycleStats", async () => {
      const { controller, tripService } = await createController();
      tripService.getMotorcycleStats.mockRejectedValue(
        new Error("Stats error"),
      );

      await expect(controller.getMotorcycleStats("ABC-123")).rejects.toThrow(
        "Stats error",
      );
    });
  });
});
