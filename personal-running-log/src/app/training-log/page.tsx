import Link from "next/link";
import { getActivitiesForFourWeeks } from "app/actions/activities";
import { getCurrentProfile } from "app/actions/auth";
import { getMonday, parseDateKey, toDateKey } from "lib/training/dates";
import TrainingLogView from "./TrainingLogView";

type PageProps = {
  searchParams: Promise<{ week?: string }>;
};

export default async function TrainingLogPage({ searchParams }: PageProps) {
  const { week } = await searchParams;
  const weekStart = week ? parseDateKey(week) : getMonday(new Date());
  const weekStartKey = toDateKey(weekStart);
  const [activities, profile] = await Promise.all([
    getActivitiesForFourWeeks(weekStartKey),
    getCurrentProfile(),
  ]);

  return (
    <div>
      {!profile && (
        <div className="border-b border-brand-100 bg-brand-50 px-4 py-3 text-center text-sm text-ink-700">
          <Link href="/login" className="font-medium text-brand-600 underline">
            Sign in
          </Link>{" "}
          to save activities to your account.
        </div>
      )}
      <TrainingLogView weekStartKey={weekStartKey} activities={activities} />
    </div>
  );
}
