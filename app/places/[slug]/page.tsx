import { supabase } from "../../lib/supabase";
import PlaceMiniMap from "@/app/components/PlaceMiniMap";
import PlaceGallery from "@/app/components/PlaceGallery";

import Header from "@/app/components/Header";

type PlacePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PlacePage({ params }: PlacePageProps) {
  const { slug } = await params;

  const { data: place, error } = await supabase
    .from("places")
    .select(`
      id,
      name,
      slug,
      city,
      country,
      category,
      categories,
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
      placeImages (
        imageUrl,
        sortOrder
      )
    `)
    .eq("slug", slug)
    .single();

  if (error || !place) {
    return (
      <main className="min-h-screen bg-stone-50 text-stone-900">
        <section className="mx-auto max-w-4xl px-6 py-20">
          <a
            href="/explore"
            className="text-sm text-stone-500 transition hover:text-stone-900"
          >
            ← Back to all places
          </a>

          <h1 className="mt-12 text-4xl font-semibold tracking-tight">
            Place not found
          </h1>
        </section>
      </main>
    );
  }

  const galleryImages =
  place.placeImages
    ?.sort((a, b) => a.sortOrder - b.sortOrder)
    .map((image) => image.imageUrl) ?? [];

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
        <Header />
      <section className="mx-auto max-w-4xl px-6 py-20">
        <a
          href="/explore"
          className="text-sm text-stone-500 transition hover:text-stone-900"
        >
          ← Back to all places
        </a>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_240px] lg:items-start">
          <div>
            <div className="flex flex-wrap gap-2">
              {(place.categories?.length
                ? place.categories
                : [place.category]
              ).map((category: string) => (
                <span
                  key={category}
                  className="rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-stone-600"
                >
                  {category}
                </span>
              ))}
            </div>

            <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl">
              {place.name}
            </h1>

            <p className="mt-3 text-lg text-stone-500">
              {place.city}, {place.country}
            </p>

            <p className="mt-4 text-sm tracking-wide text-stone-700">
              {"★".repeat(place.rating)}
            </p>
          </div>

          <div className="space-y-3">
            {place.latitude !== 0 && place.longitude !== 0 && (
              <PlaceMiniMap
                latitude={place.latitude}
                longitude={place.longitude}
                slug={place.slug}
                compact
              />
            )}

            {place.externalUrl && (
              <a
                href={place.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
              >
                <span>Website</span>
                <span>→</span>
              </a>
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-6 border-y border-stone-200 py-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
              Price
            </p>
            <p className="mt-2 text-sm text-stone-700">
              {place.priceLevel || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
              Worth a detour
            </p>
            <p className="mt-2 text-sm text-stone-700">
              {place.worthADetour ? "Yes" : "No"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
              Best for
            </p>
            <p className="mt-2 text-sm text-stone-700">
              {place.bestFor || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
              Visited
            </p>
            <p className="mt-2 text-sm text-stone-700">
              {place.visited || "—"}
            </p>
          </div>
        </div>

        {place.image && (
          <div className="mt-10 aspect-[16/9] overflow-hidden rounded-2xl bg-stone-200">
            <img
              src={place.image}
              alt={place.name}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="mt-12 max-w-3xl">
          <p className="text-lg leading-8 text-stone-700">
            {place.description}
          </p>
        </div>

        <div className="mt-14 grid gap-10 border-t border-stone-200 pt-10 md:grid-cols-3">
          <section>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
              Why I recommend it
            </p>

            <p className="mt-4 leading-7 text-stone-700">
              {place.whyRecommend || "—"}
            </p>
          </section>

          <section>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
              What to order
            </p>

            <p className="mt-4 leading-7 text-stone-700">
              {place.whatToOrder || "—"}
            </p>
          </section>

          <section>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
              Good to know
            </p>

            <p className="mt-4 leading-7 text-stone-700">
              {place.goodToKnow || "—"}
            </p>
          </section>
        </div>

        <PlaceGallery
            images={galleryImages}
            placeName={place.name}
            />
      </section>
    </main>
  );
}