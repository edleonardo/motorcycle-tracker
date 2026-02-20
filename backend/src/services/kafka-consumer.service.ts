import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { Kafka, Consumer, EachMessagePayload } from "kafkajs";
import { TripService } from "./trip.service";
import { PingDto } from "../dto/trip.dto";

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private readonly topic = "motorcycle-pings";

  constructor(private tripService: TripService) {
    this.kafka = new Kafka({
      clientId: "motorcycle-tracker",
      brokers: process.env.KAFKA_BROKERS?.split(",") || ["localhost:9092"],
    });

    this.consumer = this.kafka.consumer({
      groupId: "motorcycle-tracker-consumer-group",
    });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({
        topic: this.topic,
        fromBeginning: false,
      });

      await this.consumer.run({
        eachMessage: async ({
          topic,
          partition,
          message,
        }: EachMessagePayload) => {
          try {
            const pingData = JSON.parse(message.value.toString());
            this.logger.log(
              `Received ping from Kafka: ${pingData.licencePlate} at ${pingData.timestamp}`,
            );

            const pingDto: PingDto = {
              licencePlate: pingData.licencePlate || pingData.license_plate,
              timestamp: pingData.timestamp,
              latitude: pingData.latitude,
              longitude: pingData.longitude,
              speed: pingData.speed,
              odometer: pingData.odometer,
            };

            await this.tripService.processPing(pingDto);
          } catch (error) {
            this.logger.error(
              `Error processing Kafka message: ${error.message}`,
              error.stack,
            );
          }
        },
      });

      this.logger.log(
        `Kafka consumer started, subscribed to topic: ${this.topic}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to start Kafka consumer: ${error.message}`,
        error.stack,
      );
    }
  }

  async onModuleDestroy() {
    try {
      await this.consumer.disconnect();
      this.logger.log("Kafka consumer disconnected");
    } catch (error) {
      this.logger.error(`Error disconnecting Kafka consumer: ${error.message}`);
    }
  }
}
