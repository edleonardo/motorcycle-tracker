"use client";

import { useState, useEffect } from "react";
import { Bike, Filter } from "lucide-react";
import { tripApi, TripDetail } from "../lib/api";
import TripList from "../components/TripList";
import PingSimulator from "../components/PingSimulator";
import TripDetailModal from "../components/TripDetailModal";

export default function Home() {
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [tripDetails, setTripDetails] = useState<TripDetail | null>(null);
  const [filterPlate, setFilterPlate] = useState("");

  useEffect(() => {
    if (!selectedTripId) return;

    const loadDetails = async () => {
      try {
        const details = await tripApi.getTripDetails(selectedTripId);
        setTripDetails(details);
      } catch (err) {
        console.error("Failed to load details", err);
        setSelectedTripId(null);
      }
    };
    loadDetails();
  }, [selectedTripId]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Bike className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              TripTracker <span className="text-blue-600">PRO</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <PingSimulator />

            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-slate-800">
                <Filter className="w-5 h-5" />
                <h2 className="font-bold">Global Filters</h2>
              </div>
              <input
                type="text"
                placeholder="Search by license plate..."
                value={filterPlate}
                onChange={(e) => setFilterPlate(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </section>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30">
                <h2 className="font-bold text-slate-800">Fleet Activity</h2>
              </div>
              <div className="p-6">
                <TripList
                  licencePlate={filterPlate || undefined}
                  onTripSelect={setSelectedTripId}
                />
              </div>
            </div>
          </div>
        </div>

        {tripDetails && (
          <TripDetailModal
            trip={tripDetails}
            onClose={() => {
              setTripDetails(null);
              setSelectedTripId(null);
            }}
          />
        )}
      </main>
    </div>
  );
}
