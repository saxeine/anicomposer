"use client";

import { createPortal } from "react-dom";
import { useTextStudio } from "./studio-context";
import { StudioIcon as Icon } from "./studio-icon";
import { LibraryDialog } from "./library-dialog";
import { ExportDialog } from "./export-dialog";

/** Render once per provider. Portals preserve theme/context without being clipped by a host card. */
export function StudioOverlays() {
  const { colorMode, notice, setNotice, libraryOpen, exportOpen } =
    useTextStudio();
  if (
    typeof document === "undefined" ||
    (!notice && !libraryOpen && !exportOpen)
  )
    return null;
  return createPortal(
    <div
      className="text-submission-studio studio-overlay-root"
      data-theme={colorMode}
    >
      {notice ? (
        <div className="notice-toast" role="status" aria-live="polite">
          <span
            className={
              notice.toLowerCase().includes("could not") ||
              notice.toLowerCase().includes("add your")
                ? "toast-dot toast-dot-warn"
                : "toast-dot"
            }
          />
          {notice}
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setNotice("")}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      ) : null}
      {exportOpen ? <ExportDialog /> : libraryOpen ? <LibraryDialog /> : null}
    </div>,
    document.body,
  );
}
