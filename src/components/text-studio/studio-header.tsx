"use client";

import { useTextStudio } from "./studio-context";
import { StudioIcon as Icon } from "./studio-icon";

export function StudioHeader() {
  const {
    submissions,
    isDirty,
    isSaving,
    recordStatus,
    saveSubmission,
    setLibraryOpen,
    setExportOpen,
    isDark,
    toggleColorMode,
  } = useTextStudio();
  return (
    <header className="topbar">
      <div className="brand-lockup">
        <div className="brand-mark">
          <span>l.</span>
        </div>
        <div className="brand-copy">
          <span className="brand-name">letterform</span>
          <span className="brand-caption">TEXT IN MOTION</span>
        </div>
      </div>

      <nav className="top-nav" aria-label="Main navigation">
        <span className="nav-current">
          <span className="nav-dot" />
          Studio
        </span>
        <button
          className="nav-library"
          type="button"
          onClick={() => setLibraryOpen(true)}
        >
          <Icon name="library" size={15} /> Submissions{" "}
          <span className="nav-count">{submissions.length}</span>
        </button>
      </nav>

      <div className="top-actions">
        <div className={`save-state ${isDirty ? "save-state-dirty" : ""}`}>
          <span className="save-state-dot" />
          <span>
            {isSaving
              ? "Saving…"
              : isDirty
                ? "Unsaved changes"
                : recordStatus === "submitted"
                  ? "Submitted"
                  : "All changes saved"}
          </span>
        </div>
        <button
          className="button button-quiet theme-toggle"
          type="button"
          role="switch"
          aria-checked={isDark}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={
            isDark ? "Switch to light workspace" : "Switch to dark workspace"
          }
          onClick={toggleColorMode}
        >
          <Icon name={isDark ? "moon" : "sun"} size={15} />
          <span>{isDark ? "Dark" : "Light"}</span>
        </button>
        <button
          className="button button-quiet header-library-button"
          type="button"
          aria-label="Open submissions"
          onClick={() => setLibraryOpen(true)}
        >
          <Icon name="library" size={15} />
        </button>
        <button
          className="button button-quiet top-save"
          type="button"
          disabled={isSaving}
          onClick={() => void saveSubmission("draft")}
        >
          <Icon name="save" size={15} />{" "}
          <span>{isSaving ? "Saving" : "Save draft"}</span>
        </button>
        <button
          className="button button-dark top-export"
          type="button"
          onClick={() => setExportOpen(true)}
        >
          <Icon name="download" size={15} /> Export
        </button>
      </div>
    </header>
  );
}
