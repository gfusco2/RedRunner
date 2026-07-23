"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { updateProfile } from "app/actions/auth";
import type { DistanceUnit } from "lib/training/format";

const STORAGE_KEY = "rr_distance_unit";

type PreferencesContextValue = {
  unit: DistanceUnit;
  setUnit: (unit: DistanceUnit) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function readStoredUnit(): DistanceUnit {
  if (typeof window === "undefined") return "mi";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === "km" ? "km" : "mi";
}

export function PreferencesProvider({
  children,
  initialUnit,
}: {
  children: ReactNode;
  /** From Prisma profile when signed in; otherwise localStorage wins. */
  initialUnit?: DistanceUnit;
}) {
  const [unit, setUnitState] = useState<DistanceUnit>(initialUnit ?? "mi");
  const [ready, setReady] = useState(Boolean(initialUnit));

  useEffect(() => {
    if (initialUnit) {
      setUnitState(initialUnit);
      window.localStorage.setItem(STORAGE_KEY, initialUnit);
      setReady(true);
      return;
    }
    setUnitState(readStoredUnit());
    setReady(true);
  }, [initialUnit]);

  const setUnit = useCallback(
    (next: DistanceUnit) => {
      setUnitState(next);
      window.localStorage.setItem(STORAGE_KEY, next);
      if (initialUnit != null) {
        void updateProfile({ distanceUnit: next }).catch(() => {
          // local preference still applied; server sync best-effort
        });
      }
    },
    [initialUnit]
  );

  return (
    <PreferencesContext.Provider value={{ unit: ready ? unit : "mi", setUnit }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return ctx;
}
