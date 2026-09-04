"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type PlaceMiniMapProps = {
  latitude: number;
  longitude: number;
  slug: string;
  compact?: boolean;
};

export default function PlaceMiniMap({
  latitude,
  longitude,
  slug,
  compact = false,
}: PlaceMiniMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      if (!mapRef.current) return;

      const L = await import("leaflet");

      if (cancelled || !mapRef.current) return;
      if (leafletMapRef.current) return;

      const map = L.map(mapRef.current, {
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        attributionControl: false,
      }).setView([latitude, longitude], 13);

      leafletMapRef.current = map;

      L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
        }
      ).addTo(map);

      const customIcon = L.divIcon({
        className: "",
        html: `
          <div style="
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #a8a29e;
            border: 3px solid #fafaf9;
            box-shadow: 0 2px 8px rgba(41, 37, 36, 0.18);
          "></div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      L.marker([latitude, longitude], {
        icon: customIcon,
      }).addTo(map);

      // Leaflet sometimes initializes before the grid has its final size.
      requestAnimationFrame(() => {
        if (!cancelled) {
          map.invalidateSize();
        }
      });
    }

    initializeMap();

    return () => {
      cancelled = true;

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [latitude, longitude]);

  return (
    <a
      href={`/map?place=${slug}`}
      className="group block w-full overflow-hidden rounded-2xl border border-stone-200 bg-white"
      aria-label="Open this place on the map"
    >
      <div
        ref={mapRef}
        className={
          compact
            ? "h-[150px] w-full bg-stone-100"
            : "h-[260px] w-full bg-stone-100"
        }
      />

      <div
        className={
            compact
                ? "flex items-center justify-between border-t border-stone-200 bg-white px-4 py-3"
                : "flex items-center justify-between border-t border-stone-200 bg-white px-5 py-4"
        }
        >
            <span className="text-sm text-stone-500">
                {compact ? "Find it here" : "View location on the map"}
            </span>

            <span className="text-sm font-medium text-stone-700 transition group-hover:translate-x-1">
                →
            </span>
        </div>
    </a>
  );
}