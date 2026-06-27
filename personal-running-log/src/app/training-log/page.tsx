import { getActivitiesForWeek } from "app/actions/activities";
import {
  getMonday,
  getWeekDays,
  parseDateKey,
  toDateKey,
} from "lib/training/dates";
import TrainingLogView from "./TrainingLogView";

type PageProps = {
  searchParams: Promise<{ week?: string }>;
};

export default async function TrainingLogPage({ searchParams }: PageProps) {
  const { week } = await searchParams;
  const weekStart = week ? parseDateKey(week) : getMonday(new Date());
  const weekStartKey = toDateKey(weekStart);
  const weekDayDates = getWeekDays(weekStart).map(toDateKey);
  const activities = await getActivitiesForWeek(weekStartKey);

  return (
    <TrainingLogView
      weekStartKey={weekStartKey}
      weekDayDates={weekDayDates}
      activities={activities}
    />
  );
}
