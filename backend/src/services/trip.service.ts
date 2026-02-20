import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Trip } from "../entities/trip.entity";
import { Ping } from "../entities/ping.entity";
import { ActiveTrip } from "../entities/active-trip.entity";
import {
  PingDto,
  PaginatedTripsDto,
  TripDetailDto,
  ListTripsQueryDto,
} from "../dto/trip.dto";
import { EventEmitter2 } from "@nestjs/event-emitter";

const TRIP_CONFIG = {
  IDLE_TIMEOUT: 300,
  MIN_SPEED: 5,
  MIN_DURATION: 60,
  MIN_DISPLACEMENT: 0.3,
};

@Injectable()
export class TripService {
  private readonly logger = new Logger(TripService.name);

  constructor(
    @InjectRepository(Trip)
    private tripRepo: Repository<Trip>,
    @InjectRepository(Ping)
    private pingRepo: Repository<Ping>,
    @InjectRepository(ActiveTrip)
    private activeTripRepo: Repository<ActiveTrip>,
    private eventEmitter: EventEmitter2,
    private dataSource: DataSource,
  ) {}

  async processPing(dto: PingDto): Promise<void> {
    const activeTrip = await this.activeTripRepo.findOne({
      where: { licencePlate: dto.licencePlate },
    });

    if (activeTrip && this.shouldCloseTrip(activeTrip, dto)) {
      await this.recordPing(dto);
      await this.updateActiveTrip(activeTrip, dto);
      await this.closeTrip(activeTrip);
      return;
    }

    if (!activeTrip) {
      if (dto.speed >= TRIP_CONFIG.MIN_SPEED) {
        await this.startNewTrip(dto);
      }
    } else {
      await this.updateActiveTrip(activeTrip, dto);
    }

    await this.recordPing(dto);
  }

  private shouldCloseTrip(active: ActiveTrip, current: PingDto): boolean {
    const idleTime = current.timestamp - active.lastTimestamp;
    const isStopped = current.speed < TRIP_CONFIG.MIN_SPEED;
    const isStationary =
      current.odometer - active.lastOdometer < TRIP_CONFIG.MIN_DISPLACEMENT;

    const hasTimedOut = idleTime > TRIP_CONFIG.IDLE_TIMEOUT;
    const isFinishedTrip = isStopped && isStationary;

    return hasTimedOut || isFinishedTrip;
  }

  private async startNewTrip(dto: PingDto): Promise<void> {
    const newTrip = this.activeTripRepo.create({
      licencePlate: dto.licencePlate,
      startTimestamp: dto.timestamp,
      startLatitude: dto.latitude,
      startLongitude: dto.longitude,
      startOdometer: dto.odometer,
      lastTimestamp: dto.timestamp,
      lastLatitude: dto.latitude,
      lastLongitude: dto.longitude,
      lastOdometer: dto.odometer,
      maxSpeed: dto.speed,
    });
    await this.activeTripRepo.save(newTrip);
  }

  private async updateActiveTrip(
    active: ActiveTrip,
    dto: PingDto,
  ): Promise<void> {
    active.lastTimestamp = dto.timestamp;
    active.lastLatitude = dto.latitude;
    active.lastLongitude = dto.longitude;
    active.lastOdometer = dto.odometer;
    active.maxSpeed = Math.max(active.maxSpeed, dto.speed);
    await this.activeTripRepo.save(active);
  }

  private async closeTrip(activeTrip: ActiveTrip): Promise<void> {
    const duration = activeTrip.lastTimestamp - activeTrip.startTimestamp;

    if (duration < TRIP_CONFIG.MIN_DURATION) {
      await this.activeTripRepo.remove(activeTrip);
      return;
    }

    await this.dataSource.transaction(async (manager) => {
      const distance = activeTrip.lastOdometer - activeTrip.startOdometer;
      const avgSpeed = duration > 0 ? (distance / duration) * 3600 : 0;

      const trip = manager.create(Trip, {
        ...activeTrip,
        endTimestamp: activeTrip.lastTimestamp,
        endLatitude: activeTrip.lastLatitude,
        endLongitude: activeTrip.lastLongitude,
        totalDistance: distance,
        durationSeconds: duration,
        avgSpeed,
      });

      const savedTrip = await manager.save(trip);

      await manager
        .createQueryBuilder()
        .update(Ping)
        .set({ tripId: savedTrip.id })
        .where("licence_plate = :plate AND trip_id IS NULL", {
          plate: activeTrip.licencePlate,
        })
        .andWhere("timestamp BETWEEN :start AND :end", {
          start: activeTrip.startTimestamp,
          end: activeTrip.lastTimestamp,
        })
        .execute();

      await manager.remove(activeTrip);
      this.eventEmitter.emit("trip.completed", savedTrip);
    });
  }

  private async recordPing(dto: PingDto): Promise<void> {
    const ping = this.pingRepo.create({ ...dto, tripId: null });
    await this.pingRepo.save(ping);
    this.eventEmitter.emit("ping.received", dto);
  }

  async listTrips(query: ListTripsQueryDto): Promise<PaginatedTripsDto> {
    const { page = 1, pageSize = 10, licencePlate, startFrom, startTo } = query;
    const skip = (page - 1) * pageSize;

    const qb = this.tripRepo.createQueryBuilder("trip");

    if (licencePlate)
      qb.andWhere("trip.licencePlate ILIKE :lp", { lp: `%${licencePlate}%` });
    if (startFrom)
      qb.andWhere("trip.startTimestamp >= :startFrom", { startFrom });
    if (startTo) qb.andWhere("trip.startTimestamp <= :startTo", { startTo });

    const [trips, total] = await qb
      .orderBy("trip.startTimestamp", "DESC")
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      trips: trips.map((trip) => this.mapTripToResponse(trip)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getTripDetails(id: number): Promise<TripDetailDto> {
    const trip = await this.tripRepo.findOne({
      where: { id },
    });

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${id} not found`);
    }

    const pings = await this.pingRepo.find({
      where: { tripId: id },
      order: { timestamp: "ASC" },
    });

    return {
      ...this.mapTripToResponse(trip),
      pings: this.mapPingToResponse(pings),
    };
  }

  async getMotorcycleStats(licencePlate: string) {
    const trips = await this.tripRepo.find({
      where: { licencePlate },
    });

    if (trips.length === 0) {
      return {
        licencePlate,
        totalTrips: 0,
        totalDistance: 0,
        totalDuration: 0,
        avgTripDistance: 0,
        avgTripDuration: 0,
      };
    }

    const totalDistance = trips.reduce(
      (sum: number, trip: Trip) => sum + Number(trip.totalDistance),
      0,
    );

    const totalDuration = trips.reduce(
      (sum: number, trip: Trip) => sum + trip.durationSeconds,
      0,
    );

    return {
      licencePlate,
      totalTrips: trips.length,
      totalDistance,
      totalDuration,
      avgTripDistance: totalDistance / trips.length,
      avgTripDuration: totalDuration / trips.length,
    };
  }

  private mapTripToResponse(trip: Trip): TripDetailDto {
    return {
      ...trip,
      startTimestamp: Number(trip.startTimestamp),
      endTimestamp: Number(trip.endTimestamp),
      startLatitude: Number(trip.startLatitude),
      startLongitude: Number(trip.startLongitude),
      endLatitude: Number(trip.endLatitude),
      endLongitude: Number(trip.endLongitude),
      totalDistance: Number(trip.totalDistance),
      durationSeconds: trip.durationSeconds,
      avgSpeed: Number(trip.avgSpeed),
      maxSpeed: Number(trip.maxSpeed),
    };
  }

  private mapPingToResponse(pings: Ping[]) {
    return pings.map((ping) => ({
      ...ping,
      timestamp: Number(ping.timestamp),
      latitude: Number(ping.latitude),
      longitude: Number(ping.longitude),
      speed: Number(ping.speed),
      odometer: Number(ping.odometer),
    }));
  }
}
