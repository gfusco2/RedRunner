import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          Sign in to Red<span className="text-brand-600">Runner</span>
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Auth is powered by Supabase. App data stays on Prisma.
        </p>
      </div>
      <div className="rounded-xl border border-ink-100 bg-white p-6 shadow-soft">
        <Suspense fallback={<p className="text-sm text-ink-500">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
