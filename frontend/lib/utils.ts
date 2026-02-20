import { PingData } from "../types/trip";
import { format } from "date-fns";

const BASE_LOCATION = { lat: -23.6914, lng: -46.5654 };
const PROGRESS_STEP = 0.001;
const GPS_NOISE = 0.002;
const FINAL_INDEX = 49;
const DEFAULT_SPEED = 4.0;
const BASE_ODOMETER = 1000;

export const formatTimestamp = (timestamp: number): string => {
  return format(new Date(timestamp * 1000), "MMM dd, yyyy HH:mm:ss");
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

export const formatDistance = (km: number): string => {
  return `${km.toFixed(2)} km`;
};

export const formatSpeed = (kmh: number): string => {
  return `${kmh.toFixed(1)} km/h`;
};

export const formatCoordinate = (lat: number, lng: number): string => {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

const randomNoise = (range: number) => (Math.random() - 0.5) * range;

const isFinalPing = (index: number) => index === FINAL_INDEX;

const calculateSpeed = (index: number) => {
  if (isFinalPing(index)) return DEFAULT_SPEED;

  const speed = 20 + Math.random() * 60;
  return Math.round(speed * 10) / 10;
};

const calculateOdometer = (index: number) =>
  BASE_ODOMETER + index * (isFinalPing(index) ? 0.48 : 0.5);

export const generatePingData = (
  index: number,
  licencePlate: string,
): PingData => {
  const progress = index * PROGRESS_STEP;
  const timestamp = Math.floor(Date.now() / 1000) + index * 10;

  return {
    licencePlate,
    timestamp,
    latitude: BASE_LOCATION.lat + progress + randomNoise(GPS_NOISE),
    longitude: BASE_LOCATION.lng + progress + randomNoise(GPS_NOISE),
    speed: calculateSpeed(index),
    odometer: calculateOdometer(index),
  };
};
