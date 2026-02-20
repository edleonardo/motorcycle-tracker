import { IsString, IsNumber, IsNotEmpty, Min, Max, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PingDto {
  @ApiProperty({ example: 'ABC-1234', description: 'Motorcycle license plate' })
  @IsString()
  @IsNotEmpty()
  licencePlate: string;

  @ApiProperty({ example: 1706400000, description: 'UNIX timestamp in seconds' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  timestamp: number;

  @ApiProperty({ example: -23.5505, description: 'Latitude coordinate' })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: -46.6333, description: 'Longitude coordinate' })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ example: 45.5, description: 'Speed in km/h' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  speed: number;

  @ApiProperty({ example: 12345.67, description: 'Odometer reading in km' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  odometer: number;
}

export class TripSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  licencePlate: string;

  @ApiProperty()
  startTimestamp: number;

  @ApiProperty()
  endTimestamp: number;

  @ApiProperty()
  startLatitude: number;

  @ApiProperty()
  startLongitude: number;

  @ApiProperty()
  endLatitude: number;

  @ApiProperty()
  endLongitude: number;

  @ApiProperty()
  totalDistance: number;

  @ApiProperty()
  durationSeconds: number;

  @ApiProperty()
  avgSpeed: number;

  @ApiProperty()
  maxSpeed: number;
}

export class PingDetailDto {
  @ApiProperty()
  timestamp: number;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;

  @ApiProperty()
  speed: number;

  @ApiProperty()
  odometer: number;
}

export class TripDetailDto extends TripSummaryDto {
  @ApiProperty({ type: [PingDetailDto] })
  pings: PingDetailDto[];
}

export class PaginatedTripsDto {
  @ApiProperty({ type: [TripSummaryDto] })
  trips: TripSummaryDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class ListTripsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by license plate' })
  @IsOptional()
  @IsString()
  licencePlate?: string;

  @ApiPropertyOptional({ description: 'Filter by start timestamp (from)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  startFrom?: number;

  @ApiPropertyOptional({ description: 'Filter by start timestamp (to)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  startTo?: number;
}
