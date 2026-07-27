import Link from "next/link";
import { getActivitiesInRange } from "app/actions/activities";
import { getCurrentProfile } from "app/actions/auth";
import { listMyAthletes } from "app/actions/coaching";
import { getWeekPlan } from "app/actions/weekPlans";
import HomeWeekPreview from "components/home/HomeWeekPreview";
import {
  formatWeekLabel,
  getMonday,
  getWeekRange,
  toDateKey,
} from "lib/training/dates";
import { goalBand } from "lib/training/goals";
import { totalsForActivities } from "lib/training/totals";

export default async function HomePage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return <GuestHome />;
  }

  const today = new Date();
  const weekStart = getMonday(today);
  const weekStartKey = toDateKey(weekStart);
  const { end } = getWeekRange(weekStart);
  const endKey = toDateKey(end);

  const [activities, weekPlan, athletes] = await Promise.all([
    getActivitiesInRange(weekStartKey, endKey),
    getWeekPlan(weekStartKey),
    listMyAthletes().catch(() => []),
  ]);

  const totals = totalsForActivities(activities);
  const goal = goalBand(weekPlan?.goalRunMiles, weekPlan?.goalRangeMiles);
  const firstName =
    profile.name?.trim()?.split(/\s+/)[0] ||
    profile.email.split("@")[0];
  const coachAthlete = athletes[0] ?? null;

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="home-signed-bg pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-10 sm:py-12">
        <p className="font-display text-3xl tracking-wide text-ink-900 sm:text-4xl">
          Red<span className="text-brand-600">Runner</span>
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
          Hey {firstName}
        </h1>
        <p className="mt-1 text-sm text-ink-500 sm:text-base">
          Your week at a glance — jump in and log.
        </p>

        <div className="mt-8">
          <HomeWeekPreview
            actualMiles={totals.runMiles}
            plannedMiles={totals.plannedRunMiles}
            goal={goal}
            weekLabel={formatWeekLabel(weekStart)}
          />
        </div>

        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
          <Link
            href={`/training-log?week=${weekStartKey}`}
            className="btn-primary flex min-h-[44px] flex-1 items-center justify-center px-5 py-3 text-center"
          >
            Open Training Log
          </Link>
          <Link
            href="/dashboard"
            className="btn-ghost flex min-h-[44px] flex-1 items-center justify-center px-5 py-3 text-center"
          >
            Dashboard
          </Link>
        </div>

        {coachAthlete && (
          <p className="mt-6 text-center text-sm text-ink-500">
            Coaching{" "}
            <Link
              href={`/coach/${coachAthlete.id}`}
              className="font-medium text-brand-600 underline hover:text-brand-700"
            >
              {coachAthlete.name?.trim() || coachAthlete.email}
            </Link>
            {athletes.length > 1 ? ` +${athletes.length - 1}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}

function GuestHome() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(220,38,38,0.18), transparent 50%), linear-gradient(165deg, #0c0c0f 0%, #1a1214 42%, #7f1d1d 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="font-display text-6xl leading-none tracking-wide text-white sm:text-7xl">
          Red<span className="text-brand-500">Runner</span>
        </h1>
        <p className="mt-5 max-w-md text-base text-ink-200 sm:text-lg">
          Plan weeks, log what you ran, see the week clearly.
        </p>
        <Link
          href="/login"
          className="btn-primary mt-8 flex min-h-[48px] w-full max-w-xs items-center justify-center px-6 py-3 text-base"
        >
          Sign in
        </Link>
      </div>

      <div className="relative z-10 border-t border-white border-opacity-10 px-4 py-6">
        <ul className="mx-auto flex max-w-lg flex-col gap-3 text-center text-sm text-ink-200 sm:flex-row sm:justify-between">
          <li>
            <span className="font-semibold text-white">Log</span>
            <span className="text-ink-400"> · miles &amp; workouts</span>
          </li>
          <li>
            <span className="font-semibold text-white">Plan</span>
            <span className="text-ink-400"> · goals weeks ahead</span>
          </li>
          <li>
            <span className="font-semibold text-white">Coach</span>
            <span className="text-ink-400"> · prescribe &amp; review</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
