"use client";

import { useEffect, useRef, useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import "leaflet/dist/leaflet.css";

import { categories } from "../data/categories";

type MapPlace = {
  name: string;
  slug: string;
  city: string;
  country: string;
  category: string;
  categories: string[] | null;
  latitude: number;
  longitude: number;
  googleMapsUrl: string | null;
};

type MapClientProps = {
  places: MapPlace[];
};

const categoryColors: Record<string, string> = {
  "Coffee and Bakery": "#9A735A",
  Restaurants: "#B47762",
  Bars: "#847184",
  Hikes: "#7E8E72",
  Highlights: "#7C8EA3",
};

const INITIAL_CENTER: [number, number] = [
  58, 8,
];

const INITIAL_ZOOM = 3.7;

export default function MapClient({
  places,
}: MapClientProps) {
  const router = useRouter();

  const mapRef =
    useRef<HTMLDivElement | null>(null);

  const leafletMapRef = useRef<any>(null);
  const markerLayerRef = useRef<any>(null);

  const ignorePlaceSlugRef =
    useRef(false);

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("All");

  const [mapReady, setMapReady] =
    useState(false);

  const searchParams = useSearchParams();
  const placeSlug =
    searchParams.get("place");

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      if (!mapRef.current) return;

      const L = await import("leaflet");

      if (
        cancelled ||
        !mapRef.current
      ) {
        return;
      }

      if (leafletMapRef.current) {
        return;
      }

      const map = L.map(mapRef.current, {
        zoomSnap: 0.25,
        zoomDelta: 0.25,
      }).setView(
        INITIAL_CENTER,
        INITIAL_ZOOM
      );

      map.doubleClickZoom.disable();

      map.on("dblclick", (event: any) => {
        map.setView(
          event.latlng,
          Math.min(map.getZoom() + 1, 19)
        );
      });

      leafletMapRef.current = map;

      L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            "&copy; OpenStreetMap contributors",
          maxZoom: 19,
        }
      ).addTo(map);

      markerLayerRef.current =
        L.layerGroup().addTo(map);

      requestAnimationFrame(() => {
        map.invalidateSize();
      });

      setMapReady(true);
    }

    initializeMap();

    return () => {
      cancelled = true;

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      markerLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (
      !mapReady ||
      !leafletMapRef.current ||
      !markerLayerRef.current
    ) {
      return;
    }

    let cancelled = false;

    async function renderMarkers() {
      const L = await import("leaflet");

      if (
        cancelled ||
        !leafletMapRef.current ||
        !markerLayerRef.current
      ) {
        return;
      }

      const map =
        leafletMapRef.current;

      const markerLayer =
        markerLayerRef.current;

      markerLayer.clearLayers();

      const filteredPlaces =
        selectedCategory === "All"
          ? places
          : places.filter(
              (place) =>
                place.categories?.includes(
                  selectedCategory
                ) ||
                place.category ===
                  selectedCategory
            );

      const validPlaces =
        filteredPlaces.filter(
          (place) =>
            place.latitude != null &&
            place.longitude != null &&
            place.latitude !== 0 &&
            place.longitude !== 0
        );

      /*
       * When coming from a place page,
       * show that specific place directly.
       */
      if (
        placeSlug &&
        !ignorePlaceSlugRef.current
      ) {
        validPlaces.forEach(
          (place) => {
            const marker = L.marker(
              [
                place.latitude,
                place.longitude,
              ],
              {
                icon: createPlaceIcon(
                  L,
                  place.category
                ),
              }
            ).bindPopup(
              createPopup(place)
            );

            markerLayer.addLayer(
              marker
            );

            if (
              place.slug ===
              placeSlug
            ) {
              map.setView(
                [
                  place.latitude,
                  place.longitude,
                ],
                15
              );

              marker.openPopup();
            }
          }
        );

        return;
      }

      /*
       * Cluster places by actual visual
       * distance on the map instead of city.
       */
      const clusters =
        createGeographicClusters(
          map,
          validPlaces,
          20
        );

      clusters.forEach(
        (cluster) => {
          if (
            cluster.length === 1
          ) {
            const place =
              cluster[0];

            const marker = L.marker(
              [
                place.latitude,
                place.longitude,
              ],
              {
                icon: createPlaceIcon(
                  L,
                  place.category
                ),
              }
            ).bindPopup(
              createPopup(place)
            );

            markerLayer.addLayer(
              marker
            );

            return;
          }

          const latitude =
            cluster.reduce(
              (total, place) =>
                total +
                place.latitude,
              0
            ) / cluster.length;

          const longitude =
            cluster.reduce(
              (total, place) =>
                total +
                place.longitude,
              0
            ) / cluster.length;

          const clusterIcon =
            L.divIcon({
              className: "",
              html: `
                <div style="
                  width: 34px;
                  height: 34px;
                  border-radius: 999px;
                  background: #44403c;
                  border: 3px solid rgba(250, 250, 249, 0.95);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: #fafaf9;
                  font-size: 12px;
                  font-weight: 600;
                  box-shadow: 0 2px 8px rgba(41, 37, 36, 0.18);
                ">
                  ${cluster.length}
                </div>
              `,
              iconSize: [34, 34],
              iconAnchor: [17, 17],
            });

          const marker = L.marker(
            [
              latitude,
              longitude,
            ],
            {
              icon: clusterIcon,
            }
          );

          marker.on(
            "click",
            () => {
              map.setView(
                [
                  latitude,
                  longitude,
                ],
                Math.min(
                  map.getZoom() +
                    3,
                  14
                )
              );
            }
          );

          markerLayer.addLayer(
            marker
          );
        }
      );
    }

    renderMarkers();

    const map =
      leafletMapRef.current;

    map.on(
      "zoomend",
      renderMarkers
    );

    return () => {
      cancelled = true;

      map.off(
        "zoomend",
        renderMarkers
      );
    };
  }, [
    selectedCategory,
    mapReady,
    placeSlug,
    places,
  ]);

  function resetMapView() {
    if (!leafletMapRef.current) {
      return;
    }

    /*
     * If we arrived through ?place=...
     * remove that first, otherwise the map
     * would immediately zoom back to it.
     */
    ignorePlaceSlugRef.current =
      true;

    if (placeSlug) {
      router.replace(
        "/map",
        {
          scroll: false,
        }
      );
    }

    leafletMapRef.current.setView(
      INITIAL_CENTER,
      INITIAL_ZOOM
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
          All places
        </p>

        <h1 className="mt-4 text-5xl font-semibold tracking-tight">
          Map
        </h1>

        <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-600">
          Explore all my favorite
          places on the map.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {categories.map(
            (category) => {
              const isSelected =
                selectedCategory ===
                category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(
                      category
                    )
                  }
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                    isSelected
                      ? "border-stone-700 bg-stone-700 text-stone-50"
                      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  {category !==
                    "All" && (
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          categoryColors[
                            category
                          ] ??
                          "#a8a29e",
                      }}
                    />
                  )}

                  {category}
                </button>
              );
            }
          )}
        </div>

        <div className="relative mt-10">
          <div
            ref={mapRef}
            className="h-[600px] w-full overflow-hidden rounded-2xl border border-stone-200 bg-stone-100"
          />

          <button
            type="button"
            onClick={resetMapView}
            className="absolute right-4 top-4 z-[500] rounded-full border border-stone-200 bg-white/95 px-4 py-2 text-sm font-medium text-stone-600 shadow-sm transition hover:bg-white hover:text-stone-900"
          >
            Reset view
          </button>
        </div>
      </section>
    </main>
  );
}

function createGeographicClusters(
  map: any,
  places: MapPlace[],
  maxPixelDistance: number
) {
  const clusters: MapPlace[][] =
    [];

  places.forEach((place) => {
    const placePoint =
      map.latLngToContainerPoint([
        place.latitude,
        place.longitude,
      ]);

    let matchingCluster:
      | MapPlace[]
      | undefined;

    for (
      const cluster of clusters
    ) {
      const centerLatitude =
        cluster.reduce(
          (total, item) =>
            total +
            item.latitude,
          0
        ) / cluster.length;

      const centerLongitude =
        cluster.reduce(
          (total, item) =>
            total +
            item.longitude,
          0
        ) / cluster.length;

      const clusterPoint =
        map.latLngToContainerPoint([
          centerLatitude,
          centerLongitude,
        ]);

      const distance =
        placePoint.distanceTo(
          clusterPoint
        );

      if (
        distance <=
        maxPixelDistance
      ) {
        matchingCluster =
          cluster;

        break;
      }
    }

    if (matchingCluster) {
      matchingCluster.push(
        place
      );
    } else {
      clusters.push([place]);
    }
  });

  return clusters;
}

function createPlaceIcon(
  L: any,
  category: string
) {
  const color =
    categoryColors[category] ??
    "#78716c";

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 18px;
        height: 18px;
        border-radius: 999px;
        background: ${color};
        border: 3px solid rgba(250, 250, 249, 0.95);
        box-shadow: 0 2px 6px rgba(41, 37, 36, 0.20);
      "></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12],
  });
}

function createPopup(
  place: MapPlace
) {
  const fallbackGoogleMapsUrl =
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${place.name}, ${place.city}, ${place.country}`
    )}`;

  const googleMapsUrl =
    place.googleMapsUrl?.trim() ||
    fallbackGoogleMapsUrl;

  return `
    <div style="min-width: 230px;">
      <strong>${place.name}</strong><br />
      <span>${place.city}, ${place.country}</span><br /><br />

      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
      ">
        <a href="/places/${place.slug}">
          View place →
        </a>

        <a
          href="${googleMapsUrl}"
          target="_blank"
          rel="noopener noreferrer"
          style="text-align: right;"
        >
          Google Maps →
        </a>
      </div>
    </div>
  `;
}