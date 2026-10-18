"use client";

import { useCallback, useSyncExternalStore } from "react";
import type {
  ColorMode,
  TextSubmissionStudioProps,
  ThemePreference,
} from "./types";

const THEME_EVENT = "letterform:theme-change";
const volatilePreferences = new Map<string, ThemePreference>();
const isPreference = (value: string | null): value is ThemePreference =>
  value === "light" || value === "dark" || value === "system";

function readPreference(
  key: string,
  fallback: ThemePreference,
): ThemePreference {
  const volatile = volatilePreferences.get(key);
  if (volatile) return volatile;
  try {
    const stored = window.localStorage.getItem(key);
    return isPreference(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

function persistPreference(key: string, preference: ThemePreference) {
  try {
    window.localStorage.setItem(key, preference);
    volatilePreferences.delete(key);
  } catch {
    // The toggle still works when storage is blocked or disabled.
    volatilePreferences.set(key, preference);
  }
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: key }));
}

function subscribeToSystemTheme(listener: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", listener);
  return () => mediaQuery.removeEventListener("change", listener);
}

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function useStudioTheme({
  theme,
  defaultTheme = "system",
  onThemeChange,
  themeStorageKey = "letterform-theme",
}: Pick<
  TextSubmissionStudioProps,
  "theme" | "defaultTheme" | "onThemeChange" | "themeStorageKey"
> = {}) {
  const subscribe = useCallback(
    (listener: () => void) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key === themeStorageKey || event.key === null) {
          volatilePreferences.delete(themeStorageKey);
          listener();
        }
      };
      const onThemeEvent = (event: Event) => {
        if ((event as CustomEvent<string>).detail === themeStorageKey)
          listener();
      };
      window.addEventListener("storage", onStorage);
      window.addEventListener(THEME_EVENT, onThemeEvent);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(THEME_EVENT, onThemeEvent);
      };
    },
    [themeStorageKey],
  );
  const getSnapshot = useCallback(
    () => readPreference(themeStorageKey, defaultTheme),
    [defaultTheme, themeStorageKey],
  );
  const getServerSnapshot = useCallback(() => defaultTheme, [defaultTheme]);
  const preference = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const systemIsDark = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    () => false,
  );
  const colorMode: ColorMode =
    theme ??
    (preference === "system" ? (systemIsDark ? "dark" : "light") : preference);

  const setColorMode = useCallback(
    (next: ColorMode) => {
      persistPreference(themeStorageKey, next);
      onThemeChange?.(next);
    },
    [onThemeChange, themeStorageKey],
  );
  const toggleColorMode = useCallback(
    () => setColorMode(colorMode === "dark" ? "light" : "dark"),
    [colorMode, setColorMode],
  );

  return {
    colorMode,
    isDark: colorMode === "dark",
    setColorMode,
    toggleColorMode,
  };
}
