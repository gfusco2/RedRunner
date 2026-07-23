import Link from "next/link";

const navLink =
  "text-sm text-white/70 transition hover:text-white";

export default function Navbar() {
  return (
    <nav className="border-b border-white/10 bg-ink-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-white"
        >
          Red<span className="text-brand-500">Runner</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className={navLink}>
            Dashboard
          </Link>
          <Link href="/training-log" className={navLink}>
            Training Log
          </Link>
        </div>
      </div>
    </nav>
  );
}
