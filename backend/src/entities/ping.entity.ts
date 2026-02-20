import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Trip } from './trip.entity';

@Entity('pings')
@Index(['licencePlate'])
@Index(['timestamp'])
export class Ping {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'trip_id', nullable: true })
  tripId: number;

  @Column({ name: 'licence_plate' })
  licencePlate: string;

  @Column({ type: 'bigint' })
  timestamp: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  speed: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  odometer: number;

  @ManyToOne(() => Trip, (trip) => trip.pings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;
}
