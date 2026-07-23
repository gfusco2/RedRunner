import type { ActivityTag, SegmentKind } from "@prisma/client";

export const ACTIVITY_TAG_OPTIONS: {
  value: ActivityTag;
  label: string;
  onClass: string;
  offClass: string;
}[] = [
  {
    value: "EASY",
    label: "Easy",
    onClass: "bg-trail-600 text-white",
    offClass: "border border-trail-600 bg-trail-50 text-trail-700",
  },
  {
    value: "WORKOUT",
    label: "Workout",
    onClass: "bg-brand-600 text-white",
    offClass: "border border-brand-300 bg-brand-50 text-brand-700",
  },
  {
    value: "LONG",
    label: "Long",
    onClass: "bg-sky-600 text-white",
    offClass: "border border-sky-600 bg-sky-50 text-sky-700",
  },
  {
    value: "RACE",
    label: "Race",
    onClass: "bg-gold-600 text-white",
    offClass: "border border-gold-600 bg-gold-50 text-gold-700",
  },
];

export const TAG_LABELS: Record<ActivityTag, string> = {
  EASY: "Easy",
  WORKOUT: "Workout",
  LONG: "Long",
  RACE: "Race",
};

export const TAG_PILL_CLASS: Record<ActivityTag, string> = {
  EASY: "bg-trail-100 text-trail-700",
  WORKOUT: "bg-brand-100 text-brand-700",
  LONG: "bg-sky-100 text-sky-700",
  RACE: "bg-gold-100 text-gold-700",
};

export const SEGMENT_KIND_LABELS: Record<SegmentKind, string> = {
  WU: "Warm-up",
  MAIN: "Main",
  CD: "Cool-down",
};

export const SEGMENT_KIND_SHORT: Record<SegmentKind, string> = {
  WU: "WU",
  MAIN: "Main",
  CD: "CD",
};
