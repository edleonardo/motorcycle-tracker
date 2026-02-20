"use client";

import { X, TrendingUp, Clock, Navigation } from "lucide-react";
import dynamic from "next/dynamic";
import { TripDetail } from "../lib/api";
import {
  formatTimestamp,
  formatDistance,
  formatDuration,
  formatSpeed,
} from "../lib/utils";

const TripMap = dynamic(() => import("./TripMap"), { ssr: false });

interface TripDetailModalProps {
  trip: TripDetail;
  onClose: () => void;
}

export default function TripDetailModal({
  trip,
  onClose,
}: TripDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Trip Analysis #{trip.id}
            </h2>
            <p className="text-sm text-gray-500 font-mono">
              {trip.licencePlate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={<Navigation />}
              label="Distance"
              value={formatDistance(trip.totalDistance)}
              color="blue"
            />
            <MetricCard
              icon={<Clock />}
              label="Duration"
              value={formatDuration(trip.durationSeconds)}
              color="emerald"
            />
            <MetricCard
              icon={<TrendingUp />}
              label="Avg Speed"
              value={formatSpeed(trip.avgSpeed)}
              color="purple"
            />
            <MetricCard
              icon={<TrendingUp />}
              label="Max Speed"
              value={formatSpeed(trip.maxSpeed)}
              color="red"
            />
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              Route Visualization
            </h3>
            <TripMap
              pings={trip.pings}
              startLatitude={trip.startLatitude}
              startLongitude={trip.startLongitude}
              endLatitude={trip.endLatitude}
              endLongitude={trip.endLongitude}
            />
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">
              Telemetry Log ({trip.pings.length} points)
            </h3>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Coordinates
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Speed
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Odometer
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {trip.pings.map((ping, i) => (
                    <tr
                      key={i}
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="px-4 py-2 text-gray-600">
                        {formatTimestamp(ping.timestamp)}
                      </td>
                      <td className="px-4 py-2 text-gray-400 font-mono text-xs">
                        {ping.latitude.toFixed(4)}, {ping.longitude.toFixed(4)}
                      </td>
                      <td className="px-4 py-2 font-medium text-gray-700">
                        {formatSpeed(ping.speed)}
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {formatDistance(ping.odometer)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div
      className={`${colors[color]} p-4 rounded-xl border border-white shadow-sm`}
    >
      <div className="flex items-center gap-2 mb-1 opacity-80">
        {icon}{" "}
        <span className="text-xs font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}
