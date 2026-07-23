import Link from "next/link";
import { getCurrentProfile } from "app/actions/auth";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          Reports
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Export a training block as CSV or a print-friendly PDF.
        </p>
      </div>

      {!profile ? (
        <div className="rounded-xl border border-brand-100 bg-brand-50 p-5 text-sm text-ink-700">
          <Link href="/login" className="font-medium text-brand-600 underline">
            Sign in
          </Link>{" "}
          to generate reports from your log.
        </div>
      ) : (
        <ReportsClient />
      )}
    </div>
  );
}
