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

const UNIT_KEY = "rr_distance_unit";
const THEME_KEY = "rr_theme";

export type ThemeMode = "light" | "dark";

type PreferencesContextValue = {
  unit: DistanceUnit;
  setUnit: (unit: DistanceUnit) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function readStoredUnit(): DistanceUnit {
  if (typeof window === "undefined") return "mi";
  const raw = window.localStorage.getItem(UNIT_KEY);
  return raw === "km" ? "km" : "mi";
}

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const raw = window.localStorage.getItem(THEME_KEY);
  if (raw === "dark" || raw === "light") return raw;
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function applyThemeClass(theme: ThemeMode) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
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
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [ready, setReady] = useState(Boolean(initialUnit));

  useEffect(() => {
    if (initialUnit) {
      setUnitState(initialUnit);
      window.localStorage.setItem(UNIT_KEY, initialUnit);
    } else {
      setUnitState(readStoredUnit());
    }
    const nextTheme = readStoredTheme();
    setThemeState(nextTheme);
    applyThemeClass(nextTheme);
    setReady(true);
  }, [initialUnit]);

  const setUnit = useCallback(
    (next: DistanceUnit) => {
      setUnitState(next);
      window.localStorage.setItem(UNIT_KEY, next);
      if (initialUnit != null) {
        void updateProfile({ distanceUnit: next }).catch(() => {
          // local preference still applied; server sync best-effort
        });
      }
    },
    [initialUnit]
  );

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    window.localStorage.setItem(THEME_KEY, next);
    applyThemeClass(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: ThemeMode = prev === "dark" ? "light" : "dark";
      window.localStorage.setItem(THEME_KEY, next);
      applyThemeClass(next);
      return next;
    });
  }, []);

  return (
    <PreferencesContext.Provider
      value={{
        unit: ready ? unit : "mi",
        setUnit,
        theme,
        setTheme,
        toggleTheme,
      }}
    >
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
