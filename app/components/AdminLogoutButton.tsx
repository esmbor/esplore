"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();

    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-sm font-medium text-stone-500 transition hover:text-stone-900"
    >
      Sign out
    </button>
  );
}