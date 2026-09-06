"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "../components/Header";

import { categories } from "../data/categories";

type Place = {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  category: string;
  categories: string[] | null;
  rating: number;
  description: string;
  image: string | null;
};

type ExploreClientProps = {
  places: Place[];
};

export default function ExploreClient({ places }: ExploreClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All");

  const countries = [
    "All",
    ...Array.from(new Set(places.map((place) => place.country))).sort(),
  ];

  const cities = [
    "All",
    ...Array.from(new Set(
      places
      .filter(
        (place) =>
           selectedCountry === "All" || place.country === selectedCountry
      )
      .map((place) => place.city)
    )
  ).sort(),
  ];


  const filteredPlaces = places.filter((place) => {
    const matchesCategory =
      selectedCategory === "All" ||
      place.categories?.includes(selectedCategory) ||
      place.category === selectedCategory;

    const matchesCountry =
      selectedCountry === "All" ||
      place.country === selectedCountry;

    const matchesCity =
      selectedCity === "All" ||
      place.city === selectedCity;

    return matchesCategory && matchesCountry && matchesCity;
  });

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <Header />
      
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
          Explore My Travel Recommendations
        </p>

        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
          Find something worth stopping for. 
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
          Browse all recommendations by category, country or city. 
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          {categories.map((category) => {
            const isSelected = selectedCategory === category;

            return (
              <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                isSelected
                ? "border-stone-800 bg-stone-800 text-stone-50"
                : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
              }`}
              >
                {category}
              </button>
            );
          })}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <select
              value={selectedCountry}
              onChange={(event) => {
                setSelectedCountry(event.target.value);
                setSelectedCity("All");
              }}
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 outline-none transition focus:border-stone-500"
            >
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country === "All" ? "All countries" : country}
                </option>
              ))}
            </select>

            <select
              value={selectedCity}
              onChange={(event) => setSelectedCity(event.target.value)}
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 outline-none transition focus:border-stone-500"
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city === "All" ? "All cities" : city}
                </option>
              ))}
            </select>
          </div>

        <p className="mt-8 text-sm text-stone-500">
          {filteredPlaces.length}{" "}
          {filteredPlaces.length === 1 ? "place" : "places"}
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlaces.map((place) => (
            <Link
              key={place.name}
              href={`/places/${place.slug}`}
              className="block"
              >
            <article className="group overflow-hidden rounded-2xl border border-stone-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-stone-300 hover:shadow-sm">

              <div className="aspect-[4/3] overflow-hidden bg-stone-200">
                {place.image ? (
                  <img
                    src={place.image}
                    alt={place.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-stone-500">
                    Photo
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {(place.categories?.length
                      ? place.categories
                      : [place.category]
                    ).map((category) => (
                      <span
                        key={category}
                        className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600"
                      >
                        {category}
                      </span>
                    ))}
                  </div>

                  <span className="shrink-0 text-sm tracking-wide text-stone-700">
                    {"*".repeat(place.rating)}
                  </span>
                </div>

                <h2 className="text-2xl font-semibold tracking-tight">
                  {place.name}
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  {place.city}, {place.country}
                </p>

                <p className="mt-4 leading-7 text-stone-600">
                  {place.description}
                </p>
              </div>
            </article>
          </Link>
          ))}
        </div>
      </section>
    </main>
  )
}