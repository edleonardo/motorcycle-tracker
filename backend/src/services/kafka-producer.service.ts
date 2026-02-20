import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { PingDto } from '../dto/trip.dto';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka: Kafka;
  private producer: Producer;
  private readonly topic = 'motorcycle-pings';

  constructor() {
    this.kafka = new Kafka({
      clientId: 'motorcycle-tracker-producer',
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
    });

    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.logger.log('Kafka producer connected');
    } catch (error) {
      this.logger.error(`Failed to connect Kafka producer: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    try {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    } catch (error) {
      this.logger.error(`Error disconnecting Kafka producer: ${error.message}`);
    }
  }

  async sendPing(ping: PingDto): Promise<void> {
    try {
      await this.producer.send({
        topic: this.topic,
        messages: [
          {
            key: ping.licencePlate,
            value: JSON.stringify(ping),
            timestamp: String(ping.timestamp * 1000),
          },
        ],
      });

      this.logger.log(`Sent ping to Kafka: ${ping.licencePlate} at ${ping.timestamp}`);
    } catch (error) {
      this.logger.error(`Failed to send ping to Kafka: ${error.message}`);
      throw error;
    }
  }
}
