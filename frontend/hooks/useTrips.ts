import { useState, useEffect, useCallback } from "react";
import { tripApi, TripSummary } from "../lib/api";

export function useTrips(licencePlate?: string) {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [licencePlate]);

  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tripApi.listTrips({
        page,
        pageSize: 10,
        ...(licencePlate && { licencePlate }),
      });
      setTrips(data.trips);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError("Falha ao carregar viagens. Tente novamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, licencePlate]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  return {
    trips,
    page,
    setPage,
    totalPages,
    loading,
    error,
    refresh: loadTrips,
  };
}
