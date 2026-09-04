"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type AdminGuardProps = {
  children: ReactNode;
};

export default function AdminGuard({
  children,
}: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [checkingSession, setCheckingSession] =
    useState(true);

  const isLoginPage =
    pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setCheckingSession(false);
      return;
    }

    let mounted = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        router.replace("/admin/login");
        return;
      }

      setCheckingSession(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session && !isLoginPage) {
          router.replace("/admin/login");
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-stone-50 text-stone-900">
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-stone-500">
            Loading admin…
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}