"use client";

import "leaflet/dist/leaflet.css";
import { useTripMap } from "../hooks/useTripMap";

interface MapProps {
  pings: Array<{ latitude: number; longitude: number }>;
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
}

export default function TripMap({ pings, ...points }: MapProps) {
  const coords = {
    start: [points.startLatitude, points.startLongitude] as [number, number],
    end: [points.endLatitude, points.endLongitude] as [number, number],
  };

  const { mapRef } = useTripMap({ pings, coords });

  return (
    <div className="relative w-full h-[450px] group">
      <div
        ref={mapRef}
        className="w-full h-full rounded-xl shadow-inner border border-gray-200 z-0"
      />

      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-sm text-[10px] font-bold text-gray-500 uppercase z-[400] border border-gray-100">
        Live Track: {pings.length} points
      </div>
    </div>
  );
}
