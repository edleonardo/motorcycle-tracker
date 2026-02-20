import { useState, useRef, useCallback } from "react";
import { tripApi } from "../lib/api";
import { generatePingData } from "../lib/utils";

export function usePingSimulator() {
  const [isRunning, setIsRunning] = useState(false);
  const [pingCount, setPingCount] = useState(0);
  const [message, setMessage] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sendPing = useCallback(
    async (plate: string, useKafka: boolean, count: number) => {
      const ping = generatePingData(count, plate);
      try {
        if (useKafka) {
          await tripApi.sendPingToKafka(ping);
        } else {
          await tripApi.sendPing(ping);
        }
        return ping;
      } catch (error) {
        throw error;
      }
    },
    [],
  );

  const stopSimulation = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setMessage("Simulation stopped");
  }, []);

  const startSimulation = useCallback(
    (plate: string, useKafka: boolean) => {
      setIsRunning(true);
      setPingCount(0);
      setMessage("Simulation started...");

      let currentCount = 0;

      intervalRef.current = setInterval(async () => {
        if (currentCount >= 50) {
          stopSimulation();
          setMessage("Simulation completed!");
          return;
        }

        try {
          const ping = await sendPing(plate, useKafka, currentCount);
          currentCount++;
          setPingCount(currentCount);
          setMessage(`Sent ping ${currentCount}/50: ${ping.speed} km/h`);
        } catch (err) {
          console.error(err);
          setMessage("Error sending ping during simulation");
        }
      }, 2000);
    },
    [sendPing, stopSimulation],
  );

  const sendSingle = async (plate: string, useKafka: boolean) => {
    try {
      const ping = await sendPing(plate, useKafka, pingCount);
      setPingCount((prev) => prev + 1);
      setMessage(`Sent via ${useKafka ? "Kafka" : "HTTP"}: ${ping.speed} km/h`);
    } catch (err) {
      setMessage(`Error: ${err instanceof Error ? err.message : "Unknown"}`);
    }
  };

  return {
    isRunning,
    pingCount,
    message,
    startSimulation,
    stopSimulation,
    sendSingle,
  };
}
