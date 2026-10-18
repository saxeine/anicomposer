"use client";

import { useTextStudio } from "./studio-context";
import { StudioIcon as Icon } from "./studio-icon";
import type { CSSProperties } from "react";
import { StageLayer as PreviewLayer } from "./stage-layer";
import { formatDuration } from "./format";

export function PreviewPanel() {
  const {
    editor,
    frame,
    setFrame,
    selectedLayerId,
    activeLayer,
    submissionTitle,
    theme,
    stageFlash,
    stageInk,
    themeStyle,
    isPlaying,
    setIsPlaying,
    updateEditor,
    insertKeyframe,
  } = useTextStudio();
  return (
    <>
      <div className="preview-toolbar">
        <div className="preview-heading">
          <span className="preview-live-dot" />
          <span>LIVE PREVIEW</span>
          <span className="preview-resolution">16:9 · TEXT ONLY</span>
        </div>
        <div className="preview-options">
          <button
            className={`mini-toggle ${editor.onion ? "mini-toggle-active" : ""}`}
            type="button"
            onClick={() => updateEditor({ onion: !editor.onion })}
            aria-pressed={editor.onion}
          >
            <span className="onion-icon">
              <i />
              <i />
            </span>{" "}
            Onion
          </button>
          <button
            className={`mini-toggle ${editor.strobe ? "mini-toggle-active" : ""}`}
            type="button"
            onClick={() => updateEditor({ strobe: !editor.strobe })}
            aria-pressed={editor.strobe}
          >
            <Icon name="sun" size={14} /> Strobe
          </button>
        </div>
      </div>

      <div className="stage-wrap">
        <div
          className={`stage-surface ${stageFlash ? "stage-flashing" : ""}`}
          style={
            {
              ...themeStyle,
              backgroundColor: stageFlash ? theme.accent : theme.bg,
            } as CSSProperties
          }
        >
          <div className="stage-frame-border" />
          <div className="stage-topline">
            <span>
              LETTERFORM <i>—</i> TEXT SUBMISSION
            </span>
            <span>
              NO. {String(submissionTitle.length || 1).padStart(2, "0")}
            </span>
          </div>
          <div className="stage-editorial-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          {editor.onion && activeLayer.visible ? (
            <>
              {frame > 1 ? (
                <PreviewLayer
                  layer={activeLayer}
                  frame={Math.max(1, frame - 3)}
                  themeInk={stageInk}
                  ghost
                  ghostOpacity={editor.onionOpacity}
                  ghostColor="#ce706a"
                />
              ) : null}
              {frame < editor.duration ? (
                <PreviewLayer
                  layer={activeLayer}
                  frame={Math.min(editor.duration, frame + 3)}
                  themeInk={stageInk}
                  ghost
                  ghostOpacity={editor.onionOpacity * 0.78}
                  ghostColor="#4c9c91"
                />
              ) : null}
            </>
          ) : null}
          {editor.layers
            .filter((layer) => layer.visible)
            .map((layer) => (
              <PreviewLayer
                key={layer.id}
                layer={layer}
                frame={frame}
                themeInk={stageInk}
                selected={selectedLayerId === layer.id}
              />
            ))}
          <div className="stage-bottomline">
            <span>WORDS, IN THEIR OWN TIME.</span>
            <span>LF / {String(frame).padStart(3, "0")}</span>
          </div>
          <div className="stage-registration stage-registration-tl" />
          <div className="stage-registration stage-registration-br" />
        </div>
      </div>

      <div className="playback-controls">
        <button
          className={`play-button ${isPlaying ? "play-button-active" : ""}`}
          type="button"
          aria-label={isPlaying ? "Pause preview" : "Play preview"}
          onClick={() => setIsPlaying((playing) => !playing)}
        >
          <Icon name={isPlaying ? "pause" : "play"} size={16} />
        </button>
        <span className="time-readout">
          {formatDuration(frame, editor.fps)}
          <span> / {formatDuration(editor.duration, editor.fps)}</span>
        </span>
        <div className="playback-slider-wrap">
          <input
            aria-label="Scrub preview frame"
            className="playback-slider"
            type="range"
            min={1}
            max={editor.duration}
            value={frame}
            onChange={(event) => setFrame(Number(event.target.value))}
            style={
              {
                "--range-progress": `${((frame - 1) / (editor.duration - 1)) * 100}%`,
              } as CSSProperties
            }
          />
          <div className="playback-ticks">
            <span>START</span>
            <span>PLAYHEAD</span>
            <span>END</span>
          </div>
        </div>
        <span className="frame-readout">
          F <strong>{String(frame).padStart(2, "0")}</strong>
          <i>/</i>
          {String(editor.duration).padStart(2, "0")}
        </span>
        <button
          className="add-keyframe-button"
          type="button"
          title="Add keyframe (K)"
          onClick={insertKeyframe}
        >
          <Icon name="plus" size={14} />
          <span>Keyframe</span>
        </button>
      </div>
    </>
  );
}
