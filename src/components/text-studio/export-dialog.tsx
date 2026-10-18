"use client";

import { useTextStudio } from "./studio-context";
import { StudioIcon as Icon } from "./studio-icon";
import { StudioModal } from "./studio-modal";

export function ExportDialog() {
  const {
    editor,
    submissionTitle,
    isExporting,
    setExportOpen,
    exportWebm,
    exportText,
    copyText,
    exportProjectFile,
    idFor,
  } = useTextStudio();
  return (
    <StudioModal
      className="export-modal"
      titleId={idFor("export-title")}
      onClose={() => setExportOpen(false)}
    >
      <div className="modal-heading">
        <div>
          <span className="panel-kicker">READY WHEN YOU ARE</span>
          <h2 id={idFor("export-title")}>Take your words with you.</h2>
          <p>Export the text itself or the animated composition.</p>
        </div>
        <button
          className="modal-close"
          type="button"
          aria-label="Close export options"
          onClick={() => setExportOpen(false)}
        >
          <Icon name="close" size={17} />
        </button>
      </div>
      <button
        className="export-option export-option-featured"
        type="button"
        disabled={isExporting}
        onClick={() => void exportWebm()}
      >
        <span className="export-option-icon">
          <Icon name="film" size={19} />
        </span>
        <span className="export-option-copy">
          <strong>
            {isExporting ? "Rendering your motion clip…" : "Animated text clip"}
          </strong>
          <small>
            WebM video · {editor.duration / editor.fps} seconds · {editor.fps}{" "}
            FPS
          </small>
        </span>
        <span className="export-option-action">
          {isExporting ? (
            <span className="small-spinner" />
          ) : (
            <Icon name="download" size={16} />
          )}
        </span>
      </button>
      <div className="export-options-grid">
        <button className="export-option" type="button" onClick={exportText}>
          <span className="export-option-icon export-icon-paper">
            <Icon name="file" size={18} />
          </span>
          <span className="export-option-copy">
            <strong>Plain text</strong>
            <small>Download a .txt submission</small>
          </span>
          <span className="export-option-action">
            <Icon name="download" size={15} />
          </span>
        </button>
        <button
          className="export-option"
          type="button"
          onClick={() => void copyText()}
        >
          <span className="export-option-icon export-icon-copy">
            <Icon name="copy" size={18} />
          </span>
          <span className="export-option-copy">
            <strong>Copy words</strong>
            <small>Copy the text to clipboard</small>
          </span>
          <span className="export-option-action">
            <Icon name="arrow" size={15} />
          </span>
        </button>
      </div>
      <button
        className="project-export-link"
        type="button"
        onClick={exportProjectFile}
      >
        <Icon name="layers" size={15} />
        <span>Download editable motion project</span>
        <span>.JSON</span>
      </button>
      <div className="export-footer">
        <span>
          TEXT ONLY <i>·</i> NO STOCK MEDIA <i>·</i> ALL YOURS
        </span>
        <span>{submissionTitle}</span>
      </div>
    </StudioModal>
  );
}
