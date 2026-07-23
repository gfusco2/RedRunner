import type { Metadata } from "next";
import type { ReactNode } from "react";
import Navbar from "../components/Navbar";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "RedRunner",
  description: "Your personal training log",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <footer className="border-t border-ink-200 bg-white px-4 py-4 text-center text-xs text-ink-500">
          © {new Date().getFullYear()} RedRunner
        </footer>
      </body>
    </html>
  );
}
