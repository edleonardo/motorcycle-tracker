import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripController } from '../controllers/trip.controller';
import { TripService } from '../services/trip.service';
import { KafkaConsumerService } from '../services/kafka-consumer.service';
import { KafkaProducerService } from '../services/kafka-producer.service';
import { Trip } from '../entities/trip.entity';
import { Ping } from '../entities/ping.entity';
import { ActiveTrip } from '../entities/active-trip.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, Ping, ActiveTrip])],
  controllers: [TripController],
  providers: [TripService, KafkaConsumerService, KafkaProducerService],
  exports: [TripService, KafkaConsumerService],
})
export class TripModule {}
