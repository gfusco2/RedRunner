"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "app/actions/auth";

const tabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/training-log", label: "Training Log" },
  { href: "/settings", label: "Settings" },
] as const;

export type NavUser = {
  email: string;
  name: string | null;
};

export default function Navbar({ user }: { user: NavUser | null }) {
  const pathname = usePathname();
  const label = user?.name?.trim() || user?.email?.split("@")[0] || null;

  return (
    <nav className="border-b border-ink-700 bg-ink-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="shrink-0 text-lg font-semibold tracking-tight text-white"
        >
          Red<span className="text-brand-500">Runner</span>
        </Link>

        <div className="flex items-center gap-3">
          <div
            className="flex rounded-lg bg-ink-900 p-1"
            role="tablist"
            aria-label="Main"
          >
            {tabs.map((tab) => {
              const active =
                pathname === tab.href || pathname.startsWith(`${tab.href}/`);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  role="tab"
                  aria-selected={active}
                  className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-white hover:bg-ink-700 hover:text-white"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="max-w-[10rem] truncate text-sm text-ink-200">
                {label}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm text-white hover:text-brand-400"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            pathname !== "/login" && (
              <Link
                href="/login"
                className="hidden text-sm text-white sm:inline hover:text-brand-400"
              >
                Sign in
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
