import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center bg-gray-100 px-4">
      <h1 className="mb-4 text-4xl font-bold">Welcome to RedRunner</h1>
      <p className="mb-8 text-lg text-gray-600">
        Track runs, bike sessions, and cross-training in one place.
      </p>
      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Dashboard
        </Link>
        <Link
          href="/training-log"
          className="rounded border border-gray-300 bg-white px-4 py-2 text-gray-800 hover:bg-gray-50"
        >
          Training Log
        </Link>
      </div>
    </div>
  );
}
