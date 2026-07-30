import Link from "next/link";
import { getActivitiesForFourWeeks } from "app/actions/activities";
import { getCurrentProfile } from "lib/auth/profile";

export const maxDuration = 10;
import { getWeekPlansInRange } from "app/actions/weekPlans";
import {
  getMonday,
  getPastFourWeekRange,
  parseDateKey,
  toDateKey,
} from "lib/training/dates";
import { plansByWeekKey } from "lib/training/weekPlans";
import TrainingLogView from "./TrainingLogView";

type PageProps = {
  searchParams: Promise<{ week?: string }>;
};

export default async function TrainingLogPage({ searchParams }: PageProps) {
  const { week } = await searchParams;
  const weekStart = week ? parseDateKey(week) : getMonday(new Date());
  const weekStartKey = toDateKey(weekStart);
  const { start: rangeStart } = getPastFourWeekRange(weekStart);
  const rangeStartKey = toDateKey(rangeStart);
  // Include focus week Monday through that week's Monday only for plan lookup
  const [activities, profile, weekPlans] = await Promise.all([
    getActivitiesForFourWeeks(weekStartKey),
    getCurrentProfile(),
    getWeekPlansInRange(rangeStartKey, weekStartKey),
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
      <TrainingLogView
        weekStartKey={weekStartKey}
        activities={activities}
        plansByWeek={plansByWeekKey(weekPlans)}
        canEditGoals={Boolean(profile)}
      />
    </div>
  );
}
