"use client";

import { TripSummary } from "../lib/api";
import {
  formatTimestamp,
  formatDistance,
  formatDuration,
  formatSpeed,
} from "../lib/utils";
import { MapPin, Clock, Gauge, Navigation } from "lucide-react";
import { useTrips } from "../hooks/useTrips";

interface TripListProps {
  licencePlate?: string;
  onTripSelect?: (tripId: number) => void;
}

const TripCard = ({
  trip,
  onClick,
}: {
  trip: TripSummary;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
  >
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
          Trip #{trip.id}
        </h3>
        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-mono rounded mt-1">
          {trip.licencePlate}
        </span>
      </div>
      <time className="text-sm text-gray-400">
        {formatTimestamp(trip.startTimestamp)}
      </time>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-3 border-y border-gray-50">
      <StatItem
        icon={<Navigation className="w-4 h-4" />}
        label="Distance"
        value={formatDistance(trip.totalDistance)}
      />
      <StatItem
        icon={<Clock className="w-4 h-4" />}
        label="Duration"
        value={formatDuration(trip.durationSeconds)}
      />
      <StatItem
        icon={<Gauge className="w-4 h-4 text-slate-400" />}
        label="Avg Speed"
        value={formatSpeed(trip.avgSpeed)}
      />
      <StatItem
        icon={<Gauge className="w-4 h-4 text-red-400" />}
        label="Max Speed"
        value={formatSpeed(trip.maxSpeed)}
      />
    </div>

    <div className="mt-4 flex justify-between text-[11px] text-gray-400 uppercase tracking-wider">
      <span className="flex items-center gap-1">
        <MapPin className="w-3 h-3" /> Start: {trip.startLatitude.toFixed(4)},{" "}
        {trip.startLongitude.toFixed(4)}
      </span>
      <span className="flex items-center gap-1">
        <MapPin className="w-3 h-3" /> End: {trip.endLatitude.toFixed(4)},{" "}
        {trip.endLongitude.toFixed(4)}
      </span>
    </div>
  </div>
);

const StatItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-center space-x-2">
    <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400">{icon}</div>
    <div>
      <p className="text-[10px] uppercase text-gray-400 font-semibold">
        {label}
      </p>
      <p className="text-sm font-medium text-gray-700">{value}</p>
    </div>
  </div>
);

export default function TripList({
  licencePlate,
  onTripSelect,
}: TripListProps) {
  const { trips, page, setPage, totalPages, loading, error } =
    useTrips(licencePlate);

  if (loading && trips.length === 0) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 border border-red-100 rounded-lg text-center">
        <p className="font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm underline mt-2"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="text-center p-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
        <p className="text-slate-500 font-medium">
          No trips found for this vehicle
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {trips.map((trip) => (
          <TripCard
            key={trip.id}
            trip={trip}
            onClick={() => onTripSelect?.(trip.id)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white transition-colors"
          >
            Previous
          </button>

          <span className="text-sm text-gray-500 font-medium">
            Page <span className="text-gray-900">{page}</span> of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
