import { supabase } from "../lib/supabase";
import MapClient from "../components/MapClient";

export default async function MapPage() {
  const { data: places, error } = await supabase
    .from("places")
    .select(`
      name,
      slug,
      city,
      country,
      category,
      latitude,
      longitude
    `)
    .order("name");

  if (error) {
    console.error(error);

    return (
      <main className="min-h-screen bg-stone-50 p-10 text-stone-900">
        <p>Could not load map places.</p>
      </main>
    );
  }

  return <MapClient places={places ?? []} />;
}