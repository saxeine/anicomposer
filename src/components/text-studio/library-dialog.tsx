"use client";

import { useTextStudio } from "./studio-context";
import { StudioIcon as Icon } from "./studio-icon";
import { StudioModal } from "./studio-modal";
import { formatDate } from "./format";

export function LibraryDialog() {
  const {
    libraryCountLabel,
    isLoadingSubmissions,
    submissions,
    openSubmission,
    removeSubmission,
    setLibraryOpen,
    loadError,
    loadSubmissions,
    idFor,
  } = useTextStudio();
  return (
    <StudioModal
      className="library-modal"
      titleId={idFor("library-title")}
      onClose={() => setLibraryOpen(false)}
    >
      <div className="modal-heading">
        <div>
          <span className="panel-kicker">YOUR WORDS, KEPT</span>
          <h2 id={idFor("library-title")}>Submission library</h2>
          <p>{libraryCountLabel} saved in this workspace</p>
        </div>
        <button
          className="modal-close"
          type="button"
          aria-label="Close library"
          onClick={() => setLibraryOpen(false)}
        >
          <Icon name="close" size={17} />
        </button>
      </div>
      {isLoadingSubmissions ? (
        <div className="modal-empty">Loading your pieces…</div>
      ) : submissions.length ? (
        <div className="library-list">
          {submissions.map((item) => (
            <article className="library-item" key={item.id}>
              <button
                className="library-item-open"
                type="button"
                onClick={() => openSubmission(item)}
              >
                <span className="library-item-mark">
                  <Icon name="type" size={18} />
                </span>
                <span className="library-item-main">
                  <span className="library-item-title-row">
                    <strong>{item.title}</strong>
                    <span
                      className={`library-status ${item.status === "submitted" ? "library-status-submitted" : ""}`}
                    >
                      {item.status === "submitted" ? "Submitted" : "Draft"}
                    </span>
                  </span>
                  <span className="library-item-preview">{item.content}</span>
                  <span className="library-item-meta">
                    {item.author ? `${item.author} · ` : ""}Updated{" "}
                    {formatDate(item.updatedAt)}
                  </span>
                </span>
                <Icon name="arrow" size={16} />
              </button>
              <button
                className="library-delete"
                type="button"
                title="Delete submission"
                aria-label={`Delete ${item.title}`}
                onClick={() => void removeSubmission(item.id)}
              >
                <Icon name="trash" size={15} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="modal-empty">
          <span className="empty-book">
            <Icon name="type" size={24} />
          </span>
          <strong>Your next good sentence starts here.</strong>
          <p>
            Save a draft or submit your first piece, and it will be waiting in
            this library.
          </p>
        </div>
      )}
      {loadError ? (
        <div className="library-load-error" role="alert">
          <span>{loadError}</span>
          <button type="button" onClick={() => void loadSubmissions()}>
            Try again
          </button>
        </div>
      ) : null}
      <div className="modal-footnote">
        <Icon name="check" size={14} />
        <span>
          Drafts stay private in this workspace until you submit them.
        </span>
      </div>
    </StudioModal>
  );
}
