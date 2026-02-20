import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('active_trips')
export class ActiveTrip {
  @PrimaryColumn({ name: 'licence_plate' })
  licencePlate: string;

  @Column({ name: 'start_timestamp', type: 'bigint' })
  startTimestamp: number;

  @Column({ name: 'start_latitude', type: 'decimal', precision: 10, scale: 7 })
  startLatitude: number;

  @Column({ name: 'start_longitude', type: 'decimal', precision: 10, scale: 7 })
  startLongitude: number;

  @Column({ name: 'start_odometer', type: 'decimal', precision: 10, scale: 2 })
  startOdometer: number;

  @Column({ name: 'last_timestamp', type: 'bigint' })
  lastTimestamp: number;

  @Column({ name: 'last_latitude', type: 'decimal', precision: 10, scale: 7 })
  lastLatitude: number;

  @Column({ name: 'last_longitude', type: 'decimal', precision: 10, scale: 7 })
  lastLongitude: number;

  @Column({ name: 'last_odometer', type: 'decimal', precision: 10, scale: 2 })
  lastOdometer: number;

  @Column({ name: 'max_speed', type: 'decimal', precision: 6, scale: 2 })
  maxSpeed: number;
}
