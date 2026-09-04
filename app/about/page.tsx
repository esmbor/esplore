import Header from "../components/Header";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <Header />

      <section className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
          About
        </p>

        <div className="mt-8 grid gap-12 md:grid-cols-[1fr_1.1fr] md:items-center">
          <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-stone-200">
            <img
              src="/about/aboutMe.jpg"
              alt="Travel"
              className="h-full w-full object-cover"
            />
          </div>

          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              A collection of places I’d happily return to.
            </h1>

            <p className="mt-6 text-lg leading-8 text-stone-600">
              This is my personal collection of coffee shops, restaurants,
              bars, hidden gems and other places I’ve discovered while
              travelling.
            </p>

            <p className="mt-5 leading-7 text-stone-600">
              Everything here is based on places I’ve actually visited and
              would recommend to someone else — whether it is worth planning
              around, or simply worth remembering when you happen to be nearby.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}