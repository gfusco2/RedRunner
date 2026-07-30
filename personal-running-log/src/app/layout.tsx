import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import Navbar from "../components/Navbar";
import { getCurrentProfile, hasAuthSessionCookie } from "lib/auth/profile";
import { PreferencesProvider } from "lib/preferences";
import type { DistanceUnit } from "lib/training/format";
import "../styles/globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://redrunner.win"),
  title: "RedRunner",
  description: "Plan weeks, log what you ran, see the week clearly.",
  applicationName: "RedRunner",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

/** Bound runaway renders so a stuck request cannot eat Hobby Active CPU. */
export const maxDuration = 10;

/** Runs before paint to avoid a light flash when dark is preferred/stored. */
const themeInitScript = `(function(){try{var t=localStorage.getItem('rr_theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Guests / bots: skip Supabase + Prisma entirely (huge Hobby-plan savings).
  const profile = (await hasAuthSessionCookie())
    ? await getCurrentProfile()
    : null;
  const initialUnit: DistanceUnit =
    profile?.distanceUnit === "KM" ? "km" : "mi";

  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <PreferencesProvider initialUnit={profile ? initialUnit : undefined}>
          <Navbar
            user={
              profile
                ? { email: profile.email, name: profile.name }
                : null
            }
          />
          <main className="flex flex-grow flex-col">{children}</main>
          <footer className="border-t border-ink-200 bg-white px-4 py-3 text-center text-xs text-ink-500 print:hidden dark:border-ink-700 dark:bg-ink-950 dark:text-ink-500">
            © {new Date().getFullYear()} RedRunner
          </footer>
        </PreferencesProvider>
      </body>
    </html>
  );
}
