import Header from "../../../components/Header";
import AddPlaceForm from "../../../components/AddPlaceForm";

export default function NewPlacePage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <Header />

      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
          Admin
        </p>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Add place
        </h1>

        <p className="mt-4 text-stone-600">
          Add a new recommendation to your travel collection.
        </p>

        <div className="mt-10">
          <AddPlaceForm />
        </div>
      </section>
    </main>
  );
}