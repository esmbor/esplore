import Header from "../../components/Header";
import AdminLoginForm from "../../components/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <Header />

      <section className="mx-auto max-w-md px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
          Admin
        </p>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Sign in
        </h1>

        <p className="mt-4 text-stone-600">
          Sign in to manage your travel recommendations.
        </p>

        <div className="mt-10">
          <AdminLoginForm />
        </div>
      </section>
    </main>
  );
}