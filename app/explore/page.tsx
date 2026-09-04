import { supabase } from "../lib/supabase";
import ExploreClient from "../components/ExploreClient";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const { data: places, error } = await supabase
    .from("places")
    .select(`
      id,
      name,
      slug,
      city,
      country,
      category,
      rating,
      description,
      image
    `)
    .order("name");

  if (error) {
    console.error(error);

    return (
      <main className="min-h-screen bg-stone-50 p-10 text-stone-900">
        <p>Could not load places.</p>
      </main>
    );
  }

  return <ExploreClient places={places ?? []} />;
}