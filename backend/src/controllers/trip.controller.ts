import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  ParseIntPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { TripService } from "../services/trip.service";
import { KafkaProducerService } from "../services/kafka-producer.service";
import {
  PingDto,
  TripDetailDto,
  PaginatedTripsDto,
  ListTripsQueryDto,
} from "../dto/trip.dto";

@ApiTags("trips")
@Controller("api/trips")
export class TripController {
  constructor(
    private readonly tripService: TripService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  @Post("pings")
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: "Receive a motorcycle ping (HTTP ingestion)" })
  @ApiResponse({ status: 202, description: "Ping accepted for processing" })
  @ApiResponse({ status: 400, description: "Invalid ping data" })
  async receivePing(
    @Body(new ValidationPipe({ transform: true })) pingDto: PingDto,
  ): Promise<{ message: string }> {
    await this.tripService.processPing(pingDto);
    return { message: "Ping received and processed" };
  }

  @Post("pings/kafka")
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: "Send a ping to Kafka (event-driven ingestion)" })
  @ApiResponse({ status: 202, description: "Ping sent to Kafka queue" })
  @ApiResponse({ status: 400, description: "Invalid ping data" })
  async sendPingToKafka(
    @Body(new ValidationPipe({ transform: true })) pingDto: PingDto,
  ): Promise<{ message: string }> {
    await this.kafkaProducer.sendPing(pingDto);
    return { message: "Ping sent to Kafka queue" };
  }

  @Get()
  @ApiOperation({ summary: "List all trips with pagination and filters" })
  @ApiResponse({
    status: 200,
    description: "List of trips",
    type: PaginatedTripsDto,
  })
  async listTrips(
    @Query(new ValidationPipe({ transform: true })) query: ListTripsQueryDto,
  ): Promise<PaginatedTripsDto> {
    return this.tripService.listTrips(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get trip details including all pings" })
  @ApiResponse({
    status: 200,
    description: "Trip details",
    type: TripDetailDto,
  })
  @ApiResponse({ status: 404, description: "Trip not found" })
  async getTripDetails(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<TripDetailDto> {
    return this.tripService.getTripDetails(id);
  }

  @Get("stats/:licencePlate")
  @ApiOperation({ summary: "Get statistics for a specific motorcycle" })
  @ApiResponse({ status: 200, description: "Motorcycle statistics" })
  async getMotorcycleStats(@Param("licencePlate") licencePlate: string) {
    return this.tripService.getMotorcycleStats(licencePlate);
  }
}
