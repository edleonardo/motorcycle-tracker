import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Ping {
  licencePlate: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  speed: number;
  odometer: number;
}

export interface TripSummary {
  id: number;
  licencePlate: string;
  startTimestamp: number;
  endTimestamp: number;
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
  totalDistance: number;
  durationSeconds: number;
  avgSpeed: number;
  maxSpeed: number;
}

export interface PingDetail {
  timestamp: number;
  latitude: number;
  longitude: number;
  speed: number;
  odometer: number;
}

export interface TripDetail extends TripSummary {
  pings: PingDetail[];
}

export interface PaginatedTrips {
  trips: TripSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MotorcycleStats {
  licencePlate: string;
  totalTrips: number;
  totalDistance: number;
  totalDuration: number;
  avgTripDistance: number;
  avgTripDuration: number;
}

export const tripApi = {
  sendPing: async (ping: Ping): Promise<void> => {
    await apiClient.post("/api/trips/pings", ping);
  },

  sendPingToKafka: async (ping: Ping): Promise<void> => {
    await apiClient.post("/api/trips/pings/kafka", ping);
  },

  listTrips: async (params: {
    page?: number;
    pageSize?: number;
    licencePlate?: string;
    startFrom?: number;
    startTo?: number;
  }): Promise<PaginatedTrips> => {
    const response = await apiClient.get("/api/trips", { params });
    return response.data;
  },

  getTripDetails: async (id: number): Promise<TripDetail> => {
    const response = await apiClient.get(`/api/trips/${id}`);
    return response.data;
  },

  getMotorcycleStats: async (
    licencePlate: string,
  ): Promise<MotorcycleStats> => {
    const response = await apiClient.get(`/api/trips/stats/${licencePlate}`);
    return response.data;
  },
};

export default apiClient;
