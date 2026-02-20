import { useEffect, useRef } from "react";
import L from "leaflet";
import { createCustomIcon, fixLeafletIcons } from "../lib/mapUtils";

interface UseMapParams {
  pings: any[];
  coords: { start: L.LatLngTuple; end: L.LatLngTuple };
}

export function useTripMap({ pings, coords }: UseMapParams) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layerGroup = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    fixLeafletIcons();

    const map = L.map(mapRef.current).setView(coords.start, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    mapInstance.current = map;
    layerGroup.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !layerGroup.current) return;

    const map = mapInstance.current;
    const group = layerGroup.current;

    group.clearLayers();

    L.marker(coords.start, { icon: createCustomIcon("#10b981") })
      .addTo(group)
      .bindPopup("Início");
    L.marker(coords.end, { icon: createCustomIcon("#ef4444") })
      .addTo(group)
      .bindPopup("Fim");

    if (pings.length > 0) {
      const path = pings.map((p) => [p.latitude, p.longitude] as L.LatLngTuple);
      const polyline = L.polyline(path, {
        color: "#3b82f6",
        weight: 4,
        opacity: 0.7,
      }).addTo(group);
      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    } else {
      map.fitBounds([coords.start, coords.end], { padding: [40, 40] });
    }
  }, [pings, coords]);

  return { mapRef };
}
