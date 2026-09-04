"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type AdminPlace = {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  category: string;
  featured: boolean;
};

type AdminPlacesListProps = {
  places: AdminPlace[];
};

export default function AdminPlacesList({
  places,
}: AdminPlacesListProps) {
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] =
    useState("All");
  const [selectedCity, setSelectedCity] =
    useState("All");

  const countries = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(
          places
            .map((place) => place.country)
            .filter(Boolean)
        )
      ).sort(),
    ];
  }, [places]);

  const cities = useMemo(() => {
    const relevantPlaces =
      selectedCountry === "All"
        ? places
        : places.filter(
            (place) =>
              place.country === selectedCountry
          );

    return [
      "All",
      ...Array.from(
        new Set(
          relevantPlaces
            .map((place) => place.city)
            .filter(Boolean)
        )
      ).sort(),
    ];
  }, [places, selectedCountry]);

  const filteredPlaces = useMemo(() => {
    const query = search.trim().toLowerCase();

    return places.filter((place) => {
      const matchesSearch =
        !query ||
        [
          place.name,
          place.city,
          place.country,
          place.category,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesCountry =
        selectedCountry === "All" ||
        place.country === selectedCountry;

      const matchesCity =
        selectedCity === "All" ||
        place.city === selectedCity;

      return (
        matchesSearch &&
        matchesCountry &&
        matchesCity
      );
    });
  }, [
    places,
    search,
    selectedCountry,
    selectedCity,
  ]);

  function clearFilters() {
    setSearch("");
    setSelectedCountry("All");
    setSelectedCity("All");
  }

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCountry !== "All" ||
    selectedCity !== "All";

  return (
    <>
      <div className="mt-10 grid gap-3 md:grid-cols-[1fr_200px_200px]">
        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search places..."
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-stone-500"
        />

        <select
          value={selectedCountry}
          onChange={(event) => {
            setSelectedCountry(
              event.target.value
            );
            setSelectedCity("All");
          }}
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-stone-500"
        >
          {countries.map((country) => (
            <option
              key={country}
              value={country}
            >
              {country === "All"
                ? "All countries"
                : country}
            </option>
          ))}
        </select>

        <select
          value={selectedCity}
          onChange={(event) =>
            setSelectedCity(
              event.target.value
            )
          }
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-stone-500"
        >
          {cities.map((city) => (
            <option
              key={city}
              value={city}
            >
              {city === "All"
                ? "All cities"
                : city}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-stone-400">
          {filteredPlaces.length}{" "}
          {filteredPlaces.length === 1
            ? "place"
            : "places"}
        </p>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-stone-500 transition hover:text-stone-900"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {filteredPlaces.length > 0 ? (
          filteredPlaces.map(
            (place, index) => (
              <div
                key={place.id}
                className={`flex items-center justify-between gap-6 px-6 py-5 ${
                  index !==
                  filteredPlaces.length - 1
                    ? "border-b border-stone-200"
                    : ""
                }`}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-medium text-stone-900">
                      {place.name}
                    </h2>

                    {place.featured && (
                      <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-500">
                        Featured
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-stone-500">
                    {place.category} ·{" "}
                    {place.city},{" "}
                    {place.country}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <Link
                    href={`/places/${place.slug}`}
                    className="text-sm text-stone-500 transition hover:text-stone-900"
                  >
                    View
                  </Link>

                  <Link
                    href={`/admin/places/${place.id}`}
                    className="text-sm font-medium text-stone-700 transition hover:text-stone-900"
                  >
                    Edit →
                  </Link>
                </div>
              </div>
            )
          )
        ) : (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-stone-500">
              No places match your filters.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 text-sm font-medium text-stone-700 transition hover:text-stone-900"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </>
  );
}