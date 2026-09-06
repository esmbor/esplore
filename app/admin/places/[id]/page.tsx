import { notFound } from "next/navigation";
import Header from "../../../components/Header";
import EditPlaceForm from "../../../components/EditPlaceForm";
import { supabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

type EditPlacePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditPlacePage({
  params,
}: EditPlacePageProps) {
  const { id } = await params;

  const {
    data: place,
    error: placeError,
  } = await supabase
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
      image,
      whyRecommend,
      whatToOrder,
      goodToKnow,
      priceLevel,
      worthADetour,
      bestFor,
      visited,
      latitude,
      longitude,
      externalUrl,
      googleMapsUrl,
      featured
    `)
    .eq("id", id)
    .single();

  if (placeError || !place) {
    console.error(
      "PLACE LOAD ERROR:",
      placeError
    );

    notFound();
  }

  const {
    data: galleryData,
    error: galleryError,
  } = await supabase
    .from("placeImages")
    .select(`
      id,
      placeId,
      imageUrl,
      sortOrder
    `)
    .eq("placeId", place.id);

  if (galleryError) {
    console.error(
      "GALLERY LOAD ERROR:",
      galleryError
    );
  }

  const gallery = [
    ...(galleryData ?? []),
  ].sort(
    (a, b) =>
      (a.sortOrder ?? 0) -
      (b.sortOrder ?? 0)
  );

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <Header />

      <section className="mx-auto max-w-4xl px-6 py-16">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
            Admin
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Edit place
          </h1>

          <p className="mt-3 text-stone-500">
            {place.name}
          </p>
        </div>

        <div className="mt-10">
          <EditPlaceForm
            place={{
              ...place,
              gallery,
            }}
          />
        </div>
      </section>
    </main>
  );
}