"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
    const pathname = usePathname();


    const isHome = pathname === "/"
    const isExplore = pathname.startsWith("/explore");
    const isMap = pathname.startsWith("/map");
    const isAbout = pathname.startsWith("/about");

  return (
    <header className="border-b border-stone-200 bg-stone-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight"
        >
          Esplore
        </Link>



        <nav className="flex gap-6 text-sm">
            <Link href="/"
                className={`transition hover:text-stone-900 ${
                    isHome
                    ? "font-medium text-stone-900"
                    : "text-stone-500"
            }`}
            >
            Home
          </Link>

          <Link href="/explore"
            className={`transition hover:text-stone-900 ${
                isExplore
                ? "font-medium text-stone-900"
                : "text-stone-500"
            }`}
            >
            Explore
          </Link>

          <Link href="/map"
            className={`transition hover:text-stone-900 ${
                isMap
                ? "font-medium text-stone-900"
                : "text-stone-500"
            }`}
            >
            Map
          </Link>

          <Link href="/about"
            className={`transition hover:text-stone-900 ${
                isAbout
                ? "font-medium text-stone-900"
                : "text-stone-500"
            }`}
            >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}