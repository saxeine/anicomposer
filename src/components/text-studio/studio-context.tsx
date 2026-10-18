"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  useStudioController,
  type StudioController,
} from "./use-studio-controller";
import { useStudioTheme } from "./use-studio-theme";
import type { TextSubmissionStudioProps } from "./types";
import "./studio.css";

export type TextStudioContextValue = StudioController &
  ReturnType<typeof useStudioTheme> & {
    idFor: (name: string) => string;
    embedded: boolean;
  };

const StudioContext = createContext<TextStudioContextValue | null>(null);

export interface TextStudioProviderProps extends TextSubmissionStudioProps {
  children: ReactNode;
}

/** A scoped, independently stateful studio. Compose the exported panels inside this provider. */
export function TextStudioProvider({
  children,
  className = "",
  embedded = false,
  ...options
}: TextStudioProviderProps) {
  const controller = useStudioController(options);
  const appearance = useStudioTheme(options);
  const instanceId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const idFor = useCallback(
    (name: string) => `letterform-${instanceId}-${name}`,
    [instanceId],
  );

  useEffect(() => {
    if (!embedded && document.activeElement === document.body)
      rootRef.current?.focus({ preventScroll: true });
  }, [embedded]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey
    )
      return;
    const target = event.target;
    if (!(target instanceof HTMLElement) || !rootRef.current?.contains(target))
      return;
    if (event.key === "Escape") {
      if (controller.exportOpen) controller.setExportOpen(false);
      else if (controller.libraryOpen) controller.setLibraryOpen(false);
      return;
    }
    if (
      target.isContentEditable ||
      target.closest("input, textarea, select, [contenteditable=true]")
    )
      return;
    if (controller.libraryOpen || controller.exportOpen) return;
    if (event.code === "Space") {
      // Preserve the native Space-to-activate interaction on buttons.
      if (target.closest("button, a")) return;
      event.preventDefault();
      controller.setIsPlaying((playing) => !playing);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      controller.setFrame((frame) => Math.max(1, frame - 1));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      controller.setFrame((frame) =>
        Math.min(controller.editor.duration, frame + 1),
      );
    } else if (event.key.toLowerCase() === "k") {
      event.preventDefault();
      controller.insertKeyframe();
    }
  }

  return (
    <StudioContext.Provider
      value={{ ...controller, ...appearance, idFor, embedded }}
    >
      <div
        ref={rootRef}
        className={`text-submission-studio studio-app ${embedded ? "studio-embedded" : ""} ${className}`.trim()}
        data-theme={appearance.colorMode}
        role="region"
        aria-label="Text submission studio"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onPointerDown={(event) => {
          const target = event.target;
          if (
            target instanceof HTMLElement &&
            rootRef.current?.contains(target) &&
            !target.closest(
              "button, input, textarea, select, a, [contenteditable=true]",
            )
          ) {
            rootRef.current.focus({ preventScroll: true });
          }
        }}
      >
        {children}
      </div>
    </StudioContext.Provider>
  );
}

/** Access state and actions from custom controls anywhere within TextStudioProvider. */
export function useTextStudio(): TextStudioContextValue {
  const context = useContext(StudioContext);
  if (!context)
    throw new Error("useTextStudio must be used inside TextStudioProvider.");
  return context;
}
