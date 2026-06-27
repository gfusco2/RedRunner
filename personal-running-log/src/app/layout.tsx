import type { Metadata } from "next";
import type { ReactNode } from "react";
import Navbar from "../components/Navbar";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "RedRunner",
  description: "Your personal running log",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <footer className="bg-gray-800 p-4 text-center text-white">
          © {new Date().getFullYear()} RedRunner. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
