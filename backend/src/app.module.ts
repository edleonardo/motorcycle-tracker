import { Module } from '@nestjs/common';
import { KafkaConsumerService } from './services/kafka-consumer.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TripModule } from './modules/trip.module';
import { Trip } from './entities/trip.entity';
import { Ping } from './entities/ping.entity';
import { ActiveTrip } from './entities/active-trip.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE as any || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'motorcycle_tracker',
      entities: [Trip, Ping, ActiveTrip],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    EventEmitterModule.forRoot(),
    TripModule,
  ],
})
export class AppModule {
  constructor(private readonly kafkaConsumerService: KafkaConsumerService) {}
}
