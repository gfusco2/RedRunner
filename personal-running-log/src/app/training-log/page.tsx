import { getActivitiesForFourWeeks } from "app/actions/activities";
import { getMonday, parseDateKey, toDateKey } from "lib/training/dates";
import TrainingLogView from "./TrainingLogView";

type PageProps = {
  searchParams: Promise<{ week?: string }>;
};

export default async function TrainingLogPage({ searchParams }: PageProps) {
  const { week } = await searchParams;
  const weekStart = week ? parseDateKey(week) : getMonday(new Date());
  const weekStartKey = toDateKey(weekStart);
  const activities = await getActivitiesForFourWeeks(weekStartKey);

  return (
    <TrainingLogView weekStartKey={weekStartKey} activities={activities} />
  );
}
