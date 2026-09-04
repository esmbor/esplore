import Link from "next/link";
import Header from "../components/Header";
import AdminLogoutButton from "../components/AdminLogoutButton";
import AdminPlacesList from "../components/AdminPlacesList";
import { supabase } from "../lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { data: places, error } = await supabase
    .from("places")
    .select(`
      id,
      name,
      slug,
      city,
      country,
      category,
      featured
    `)
    .order("name");

  if (error) {
    console.error(error);

    return (
      <main className="min-h-screen bg-stone-50 text-stone-900">
        <Header />

        <section className="mx-auto max-w-6xl px-6 py-16">
          <p>Could not load places.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <Header />

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
              Admin
            </p>

            <h1 className="mt-4 text-5xl font-semibold tracking-tight">
              Places
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-600">
              Manage the places in your travel collection.
            </p>
          </div>

          <div className="flex items-center gap-5">
            <AdminLogoutButton />

            <Link
              href="/admin/places/new"
              className="rounded-full bg-stone-800 px-5 py-3 text-sm font-medium text-stone-50 transition hover:bg-stone-700"
            >
              Add place
            </Link>
          </div>
        </div>

        <AdminPlacesList places={places ?? []} />
      </section>
    </main>
  );
}