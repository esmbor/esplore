import Link from "next/link";
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
      featured
    `)
    .eq("id", id)
    .single();

  if (placeError || !place) {
    console.error(
      "PLACE ERROR:",
      JSON.stringify(placeError, null, 2)
    );

    return (
      <main className="min-h-screen bg-stone-50 text-stone-900">
        <Header />

        <section className="mx-auto max-w-3xl px-6 py-16">
          <p className="text-sm text-stone-500">
            Place not found.
          </p>

          <Link
            href="/admin"
            className="mt-6 inline-block text-sm font-medium text-stone-700"
          >
            ← Back to admin
          </Link>
        </section>
      </main>
    );
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
      "GALLERY ERROR DETAILS:",
      JSON.stringify(
        {
          message: galleryError.message,
          details: galleryError.details,
          hint: galleryError.hint,
          code: galleryError.code,
        },
        null,
        2
      )
    );
  }

  const gallery = [...(galleryData ?? [])].sort(
    (a, b) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <Header />

      <section className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/admin"
          className="text-sm text-stone-500 transition hover:text-stone-900"
        >
          ← Back to places
        </Link>

        <p className="mt-10 text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
          Admin
        </p>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Edit place
        </h1>

        <p className="mt-4 text-stone-600">
          Update the details for {place.name}.
        </p>

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