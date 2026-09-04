import { supabase } from "../lib/supabase";

export default async function TestSupabasePage() {
  const { data, error } = await supabase
    .from("places")
    .select("*");

  return (
    <main className="min-h-screen bg-stone-50 p-10 text-stone-900">
      <h1 className="text-3xl font-semibold">
        Supabase test
      </h1>

      <pre className="mt-6 whitespace-pre-wrap text-sm">
        {JSON.stringify({ data, error }, null, 2)}
      </pre>
    </main>
  );
}