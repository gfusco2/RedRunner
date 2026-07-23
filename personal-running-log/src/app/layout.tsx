import type { ReactNode } from "react";
import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import { getCurrentProfile } from "app/actions/auth";
import { PreferencesProvider } from "lib/preferences";
import type { DistanceUnit } from "lib/training/format";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "RedRunner",
  description: "Your personal training log",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile();
  const initialUnit: DistanceUnit =
    profile?.distanceUnit === "KM" ? "km" : "mi";

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans">
        <PreferencesProvider initialUnit={profile ? initialUnit : undefined}>
          <Navbar
            user={
              profile
                ? { email: profile.email, name: profile.name }
                : null
            }
          />
          <main className="flex-grow">{children}</main>
          <footer className="border-t border-ink-200 bg-white px-4 py-4 text-center text-xs text-ink-500">
            © {new Date().getFullYear()} RedRunner
          </footer>
        </PreferencesProvider>
      </body>
    </html>
  );
}
