"use client";

import { TextStudioProvider, useTextStudio } from "./studio-context";
import { StudioHeader } from "./studio-header";
import { SubmissionPanel } from "./submission-panel";
import { PreviewPanel } from "./preview-panel";
import { TimelinePanel } from "./timeline-panel";
import { InspectorPanel } from "./inspector-panel";
import { StudioOverlays } from "./studio-overlays";
import type { TextSubmissionStudioProps } from "./types";

/** Default panel composition. Use the individual panels for a custom layout. */
export function TextStudioWorkspace() {
  const { editor, embedded } = useTextStudio();
  return (
    <div className="workspace-shell">
      {!embedded ? (
        <section className="workspace-intro">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" />
              TEXT SUBMISSION STUDIO <span className="eyebrow-index">/ 01</span>
            </div>
            <h1>
              Give your words a little <em>room to move.</em>
            </h1>
            <p>
              Write it, shape it, and bring your submission to life — one
              thoughtful frame at a time.
            </p>
          </div>
          <div className="shortcut-hint">
            <span className="shortcut-glyph">⌘</span>
            <span>Space to preview</span>
            <span className="shortcut-divider" />
            <span>
              <kbd>K</kbd> add keyframe
            </span>
          </div>
        </section>
      ) : null}
      <div className="editor-grid">
        <SubmissionPanel />
        <section
          className="center-panel"
          aria-label="Text animation preview and timeline"
        >
          <PreviewPanel />
          <TimelinePanel />
        </section>
        <InspectorPanel />
      </div>
      {!embedded ? (
        <footer className="workspace-footer">
          <span>
            <span className="footer-logo">l.</span> Made for words worth
            sharing.
          </span>
          <span>
            LETTERFORM <i>·</i> TEXT MOTION STUDIO <i>·</i> {editor.fps} FPS
          </span>
        </footer>
      ) : null}
    </div>
  );
}

/** Drop-in studio; set embedded to place it inside a page, card, drawer, or another component. */
export function TextSubmissionStudio(props: TextSubmissionStudioProps = {}) {
  return (
    <TextStudioProvider {...props}>
      <StudioHeader />
      <TextStudioWorkspace />
      <StudioOverlays />
    </TextStudioProvider>
  );
}

export default TextSubmissionStudio;
