import { Suspense } from "react";
import Header from "../components/Header";
import MapClient from "../components/MapClient";
import { supabase } from "../lib/supabase";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const { data: places, error } = await supabase
    .from("places")
    .select(`
      name,
      slug,
      city,
      country,
      category,
      categories,
      latitude,
      longitude,
      googleMapsUrl
    `)
    .order("name");

  if (error) {
    console.error(error);

    return (
      <main className="min-h-screen bg-stone-50 text-stone-900">
        <Header />

        <section className="mx-auto max-w-6xl px-6 py-16">
          <p>Could not load the map.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <Header />

      <Suspense
        fallback={
          <div className="flex min-h-[70vh] items-center justify-center text-sm text-stone-500">
            Loading map…
          </div>
        }
      >
        <MapClient places={places ?? []} />
      </Suspense>
    </main>
  );
}