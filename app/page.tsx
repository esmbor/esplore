import Link from "next/link";
import Header from "./components/Header";
import { supabase } from "./lib/supabase";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { data: featuredPlaces, error } = await supabase
    .from("places")
    .select(`
      name,
      slug,
      city,
      country,
      category,
      description,
      image
    `)
    .eq("featured", true)
    .order("name")
    .limit(3);

  if (error) {
    console.error(error);
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <Header />

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
            A personal travel collection
          </p>

          <h1 className="mt-5 text-5xl font-semibold tracking-tight sm:text-6xl">
            The places I’d tell you not to miss.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
            From tiny coffee bars and memorable restaurants to scenic stops,
            local markets and places I stumbled across by accident. This is a
            collection of the places that stood out enough to remember — and
            that I would happily recommend to someone else.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/explore"
              className="rounded-full bg-stone-800 px-5 py-3 text-sm font-medium text-stone-50 transition hover:bg-stone-700"
            >
              Browse my recommendations
            </Link>

            <Link
              href="/map"
              className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
            >
              View map
            </Link>
          </div>
        </div>
      </section>

      {featuredPlaces && featuredPlaces.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
                Featured places
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                A few places to start.
              </h2>
            </div>

            <Link
              href="/explore"
              className="hidden text-sm font-medium text-stone-600 transition hover:text-stone-900 sm:block"
            >
              View all →
            </Link>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {featuredPlaces.map((place) => (
              <Link
                key={place.slug}
                href={`/places/${place.slug}`}
                className="group overflow-hidden rounded-2xl border border-stone-200 bg-white"
              >
                <div className="aspect-[4/3] overflow-hidden bg-stone-200">
                  {place.image && (
                    <img
                      src={place.image}
                      alt={place.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                    />
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500">
                      {place.category}
                    </p>

                    <p className="text-xs text-stone-400">
                      {place.city}, {place.country}
                    </p>
                  </div>

                  <h3 className="mt-3 text-xl font-semibold tracking-tight">
                    {place.name}
                  </h3>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">
                    {place.description}
                  </p>

                  <p className="mt-5 text-sm font-medium text-stone-700">
                    View place →
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 sm:hidden">
            <Link
              href="/explore"
              className="text-sm font-medium text-stone-600 transition hover:text-stone-900"
            >
              View all recommendations →
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}