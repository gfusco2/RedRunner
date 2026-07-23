import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.12),_transparent_55%),linear-gradient(to_bottom,#f7f7f8,#ffffff)]" />
      <div className="relative z-10 max-w-xl text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Personal training log
        </p>
        <h1 className="mb-4 text-5xl font-semibold tracking-tight text-ink-900">
          Red<span className="text-brand-600">Runner</span>
        </h1>
        <p className="mb-8 text-base text-ink-500">
          Plan workouts, log miles, and see the week at a glance.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/dashboard" className="btn-primary">
            Dashboard
          </Link>
          <Link href="/training-log" className="btn-ghost">
            Training Log
          </Link>
        </div>
      </div>
    </div>
  );
}
