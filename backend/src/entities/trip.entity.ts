import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, Index } from 'typeorm';
import { Ping } from './ping.entity';

@Entity('trips')
@Index(['licencePlate'])
@Index(['startTimestamp'])
export class Trip {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'licence_plate' })
  licencePlate: string;

  @Column({ name: 'start_timestamp', type: 'bigint' })
  startTimestamp: number;

  @Column({ name: 'end_timestamp', type: 'bigint' })
  endTimestamp: number;

  @Column({ name: 'start_latitude', type: 'decimal', precision: 10, scale: 7 })
  startLatitude: number;

  @Column({ name: 'start_longitude', type: 'decimal', precision: 10, scale: 7 })
  startLongitude: number;

  @Column({ name: 'end_latitude', type: 'decimal', precision: 10, scale: 7 })
  endLatitude: number;

  @Column({ name: 'end_longitude', type: 'decimal', precision: 10, scale: 7 })
  endLongitude: number;

  @Column({ name: 'total_distance', type: 'decimal', precision: 10, scale: 2 })
  totalDistance: number;

  @Column({ name: 'duration_seconds', type: 'int' })
  durationSeconds: number;

  @Column({ name: 'avg_speed', type: 'decimal', precision: 6, scale: 2 })
  avgSpeed: number;

  @Column({ name: 'max_speed', type: 'decimal', precision: 6, scale: 2 })
  maxSpeed: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Ping, (ping) => ping.trip, { cascade: true })
  pings: Ping[];
}
