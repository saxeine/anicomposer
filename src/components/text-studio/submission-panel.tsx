"use client";

import { useTextStudio } from "./studio-context";
import { StudioIcon as Icon } from "./studio-icon";
import { layerMeta } from "./config";
import { formatDate } from "./format";

export function SubmissionPanel() {
  const {
    editor,
    submissionTitle,
    setSubmissionTitle,
    selectedLayerId,
    setSelectedLayerId,
    activeLayer,
    currentTextLength,
    markEdited,
    updateLayerStyle,
    updateLayerText,
    isSaving,
    saveSubmission,
    recentSubmissions,
    isLoadingSubmissions,
    loadError,
    setLibraryOpen,
    openSubmission,
    idFor,
  } = useTextStudio();
  return (
    <aside className="left-panel">
      <div className="panel-heading">
        <div className="panel-title-wrap">
          <span className="panel-kicker">THE WORDS</span>
          <h2>Your submission</h2>
        </div>
        <span className="panel-number">01</span>
      </div>

      <label className="field-label" htmlFor={idFor("submission-title")}>
        Submission title
      </label>
      <input
        className="text-input title-input"
        id={idFor("submission-title")}
        maxLength={120}
        value={submissionTitle}
        onChange={(event) => {
          markEdited();
          setSubmissionTitle(event.target.value);
        }}
        placeholder="Give this piece a name"
      />

      <div className="section-rule">
        <span>TEXT LAYERS</span>
        <span className="section-rule-line" />
        <span className="section-rule-count">03</span>
      </div>
      <div className="layer-list" role="list" aria-label="Text layers">
        {editor.layers.map((layer) => (
          <div
            className={`layer-list-item ${selectedLayerId === layer.id ? "layer-list-item-active" : ""}`}
            key={layer.id}
          >
            <button
              className="layer-select"
              type="button"
              onClick={() => setSelectedLayerId(layer.id)}
              aria-pressed={selectedLayerId === layer.id}
            >
              <span className="layer-number">{layerMeta[layer.id].number}</span>
              <span className="layer-type-icon">
                <Icon name="type" size={15} />
              </span>
              <span className="layer-copy">
                <strong>{layer.label}</strong>
                <span>
                  {layer.text.trim()
                    ? layer.text.replace(/\s+/g, " ").slice(0, 30)
                    : "Empty text layer"}
                </span>
              </span>
            </button>
            <button
              className={`layer-visibility ${layer.visible ? "" : "layer-visibility-off"}`}
              type="button"
              title={layer.visible ? "Hide text layer" : "Show text layer"}
              aria-label={`${layer.visible ? "Hide" : "Show"} ${layer.label}`}
              onClick={() =>
                updateLayerStyle(layer.id, { visible: !layer.visible })
              }
            >
              <Icon name={layer.visible ? "eye" : "eyeOff"} size={15} />
            </button>
          </div>
        ))}
      </div>

      <div className="text-editor-heading">
        <label className="field-label" htmlFor={idFor("active-layer-text")}>
          Edit {activeLayer.label.toLowerCase()}
        </label>
        <span className="text-character-count">
          {currentTextLength}
          <span>
            /
            {activeLayer.id === "body"
              ? "5000"
              : activeLayer.id === "byline"
                ? "80"
                : "240"}
          </span>
        </span>
      </div>
      <textarea
        id={idFor("active-layer-text")}
        className={`text-area ${activeLayer.id === "body" ? "text-area-body" : ""}`}
        value={activeLayer.text}
        onChange={(event) =>
          updateLayerText(
            activeLayer.id,
            event.target.value.slice(
              0,
              activeLayer.id === "body"
                ? 5000
                : activeLayer.id === "byline"
                  ? 80
                  : 240,
            ),
          )
        }
        placeholder={layerMeta[activeLayer.id].placeholder}
        maxLength={
          activeLayer.id === "body"
            ? 5000
            : activeLayer.id === "byline"
              ? 80
              : 240
        }
        rows={activeLayer.id === "body" ? 5 : 3}
      />
      {activeLayer.id === "body" ? (
        <p className="field-note">
          Your text is the heart of this piece. Keep it under 5,000 characters.
        </p>
      ) : null}

      <div className="submission-footer">
        <div className="privacy-note">
          <span className="privacy-dot" />
          Private until you submit
        </div>
        <button
          className="button button-submit"
          type="button"
          disabled={isSaving}
          onClick={() => void saveSubmission("submitted")}
        >
          Submit text <Icon name="arrow" size={15} />
        </button>
      </div>

      <div className="recent-block">
        <div className="recent-heading">
          <div>
            <span className="panel-kicker">YOUR LIBRARY</span>
            <strong>Recent pieces</strong>
          </div>
          <button
            type="button"
            className="text-link"
            onClick={() => setLibraryOpen(true)}
          >
            View all <Icon name="arrow" size={13} />
          </button>
        </div>
        {isLoadingSubmissions ? (
          <p className="recent-empty">Loading your submissions…</p>
        ) : recentSubmissions.length ? (
          <div className="recent-list">
            {recentSubmissions.map((item) => (
              <button
                className="recent-item"
                type="button"
                key={item.id}
                onClick={() => openSubmission(item)}
              >
                <span
                  className={`status-mark ${item.status === "submitted" ? "status-mark-submitted" : ""}`}
                />
                <span className="recent-item-copy">
                  <strong>{item.title}</strong>
                  <span>
                    {item.status === "submitted" ? "Submitted" : "Draft"} ·{" "}
                    {formatDate(item.updatedAt)}
                  </span>
                </span>
                <Icon name="chevron" size={14} />
              </button>
            ))}
          </div>
        ) : (
          <p className="recent-empty">
            Saved drafts and submissions will appear here.
          </p>
        )}
        {loadError ? <p className="load-error">{loadError}</p> : null}
      </div>
    </aside>
  );
}
