"use client";

import { useState } from "react";
import { Play, Square, Send } from "lucide-react";
import { usePingSimulator } from "../hooks/usePingSimulator";

export default function PingSimulator() {
  const [licencePlate, setLicencePlate] = useState("TEST-001");
  const [useKafka, setUseKafka] = useState(false);

  const {
    isRunning,
    pingCount,
    message,
    startSimulation,
    stopSimulation,
    sendSingle,
  } = usePingSimulator();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Ping Simulator</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            License Plate
          </label>
          <input
            type="text"
            value={licencePlate}
            onChange={(e) => setLicencePlate(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
            disabled={isRunning}
          />
        </div>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useKafka}
            onChange={(e) => setUseKafka(e.target.checked)}
            disabled={isRunning}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm text-gray-700">
            Use Kafka (Event-Driven)
          </span>
        </label>

        <div className="flex gap-2">
          <button
            onClick={() => sendSingle(licencePlate, useKafka)}
            disabled={isRunning}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Single Ping</span>
          </button>

          <button
            onClick={() =>
              isRunning
                ? stopSimulation()
                : startSimulation(licencePlate, useKafka)
            }
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors ${
              isRunning
                ? "bg-red-500 hover:bg-red-600"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {isRunning ? (
              <Square className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{isRunning ? "Stop" : "Start Simulation"}</span>
          </button>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg border ${message.includes("Error") ? "bg-red-50 border-red-200 text-red-700" : "bg-blue-50 border-blue-200 text-blue-700"}`}
          >
            <p className="text-sm font-medium">{message}</p>
            {pingCount > 0 && (
              <p className="text-xs opacity-80">Total pings: {pingCount}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
