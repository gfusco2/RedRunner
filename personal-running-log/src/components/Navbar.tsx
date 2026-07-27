"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "app/actions/auth";
import ThemeToggle from "components/ThemeToggle";
import { usePreferences } from "lib/preferences";

const tabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/training-log", label: "Training Log" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
] as const;

export type NavUser = {
  email: string;
  name: string | null;
};

export default function Navbar({ user }: { user: NavUser | null }) {
  const pathname = usePathname();
  const { theme } = usePreferences();
  const isLanding = pathname === "/";
  /** Dark chrome: app pages, guest hero, or signed-in home when dark mode is on. */
  const darkChrome = !isLanding || !user || theme === "dark";
  const label = user?.name?.trim() || user?.email?.split("@")[0] || null;
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const brandClass = darkChrome
    ? "font-display text-2xl tracking-wide text-white"
    : "font-display text-2xl tracking-wide text-ink-900";

  const navShell = darkChrome
    ? "border-b border-ink-700 bg-ink-950"
    : "border-b border-ink-100 bg-white bg-opacity-90";

  const linkIdle = darkChrome
    ? "text-white hover:bg-ink-700"
    : "text-ink-700 hover:bg-ink-100";

  const linkActive = "bg-brand-600 text-white";

  const metaClass = darkChrome
    ? "text-white hover:text-brand-400"
    : "text-ink-500 hover:text-brand-700";

  const menuBtnClass = darkChrome
    ? "border-ink-700 text-white hover:bg-ink-900"
    : "border-ink-200 text-ink-800 hover:bg-ink-50";

  const themeBtnClass = darkChrome
    ? "border-ink-700 text-white hover:bg-ink-900"
    : "border-ink-200 text-ink-800 hover:bg-ink-50";

  const tabRailClass = darkChrome ? "bg-ink-900" : "bg-ink-100";

  const mobilePanelClass = darkChrome
    ? "border-ink-800 bg-ink-950"
    : "border-ink-100 bg-white";

  const mobileIdle = darkChrome
    ? "text-white hover:bg-ink-900"
    : "text-ink-800 hover:bg-ink-50";

  return (
    <nav className={`relative z-40 ${navShell}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className={`shrink-0 ${brandClass}`}>
          Red<span className="text-brand-500">Runner</span>
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <div
            className={`flex rounded-lg p-1 ${tabRailClass}`}
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
                  className={`rounded-md px-3.5 py-2 text-sm font-medium transition ${
                    active ? linkActive : linkIdle
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          <ThemeToggle className={themeBtnClass} />

          {user ? (
            <div className="flex items-center gap-2">
              <span
                className={`max-w-[10rem] truncate text-sm ${
                  darkChrome ? "text-ink-200" : "text-ink-500"
                }`}
              >
                {label}
              </span>
              <form action={signOut}>
                <button type="submit" className={`text-sm ${metaClass}`}>
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            pathname !== "/login" && (
              <Link href="/login" className={`text-sm font-medium ${metaClass}`}>
                Sign in
              </Link>
            )
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle className={themeBtnClass} />
          {!user && pathname !== "/login" && (
            <Link
              href="/login"
              className="flex min-h-[44px] items-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white"
            >
              Sign in
            </Link>
          )}
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
            className={`inline-flex h-11 min-w-[44px] items-center justify-center rounded-md border px-3 text-sm font-semibold ${menuBtnClass}`}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="mobile-nav" className={`border-t md:hidden ${mobilePanelClass}`}>
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {tabs.map((tab) => {
              const active =
                pathname === tab.href || pathname.startsWith(`${tab.href}/`);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`rounded-md px-3 py-3 text-base font-medium ${
                    active ? "bg-brand-600 text-white" : mobileIdle
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
            {user ? (
              <div
                className={`mt-2 flex items-center justify-between border-t pt-3 ${
                  darkChrome ? "border-ink-800" : "border-ink-100"
                }`}
              >
                <span
                  className={`truncate text-sm ${
                    darkChrome ? "text-ink-300" : "text-ink-500"
                  }`}
                >
                  {label}
                </span>
                <form action={signOut}>
                  <button
                    type="submit"
                    className={`px-2 py-2 text-sm font-medium ${metaClass}`}
                  >
                    Sign out
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
}
