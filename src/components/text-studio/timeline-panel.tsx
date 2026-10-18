"use client";

import { useTextStudio } from "./studio-context";
import { StudioIcon as Icon } from "./studio-icon";
import { supportedDurations } from "./config";

export function TimelinePanel() {
  const {
    editor,
    frame,
    setFrame,
    selectedLayerId,
    setSelectedLayerId,
    chooseDuration,
    scrubTimeline,
  } = useTextStudio();
  return (
    <section className="timeline-panel" aria-label="Text animation timeline">
      <div className="timeline-header">
        <div className="timeline-title">
          <Icon name="layers" size={15} />
          <span>TIMELINE</span>
          <span className="timeline-layer-count">
            {editor.layers.length} TEXT TRACKS
          </span>
        </div>
        <div className="timeline-settings">
          <label className="duration-select-wrap">
            <Icon name="clock" size={13} />
            <select
              aria-label="Animation duration"
              value={editor.duration}
              onChange={(event) => chooseDuration(event.target.value)}
            >
              {supportedDurations.map((duration) => (
                <option key={duration} value={duration}>
                  {Number((duration / editor.fps).toFixed(1))} seconds
                </option>
              ))}
            </select>
            <Icon name="chevron" size={12} />
          </label>
          <span className="fps-badge">{editor.fps} FPS</span>
        </div>
      </div>
      <div className="timeline-grid">
        <div className="timeline-ruler-row">
          <div className="track-label-spacer">
            <span>FRAME</span>
          </div>
          <div className="timeline-ruler">
            {[0, 0.25, 0.5, 0.75, 1].map((fraction, index) => {
              const tickFrame = Math.round(
                1 + fraction * (editor.duration - 1),
              );
              return (
                <span
                  className="timeline-tick"
                  key={fraction}
                  style={{ left: `${fraction * 100}%` }}
                >
                  <i />
                  {index === 0 ? "01" : String(tickFrame).padStart(2, "0")}
                </span>
              );
            })}
          </div>
        </div>
        {editor.layers.map((layer) => {
          const laneProgress = ((frame - 1) / (editor.duration - 1)) * 100;
          return (
            <div
              className={`timeline-track-row ${selectedLayerId === layer.id ? "timeline-track-active" : ""}`}
              key={layer.id}
            >
              <button
                className="track-name"
                type="button"
                onClick={() => setSelectedLayerId(layer.id)}
                aria-pressed={selectedLayerId === layer.id}
              >
                <span className={`track-color track-color-${layer.id}`} />
                <span>{layer.label}</span>
                <span className="track-key-count">
                  {layer.keyframes.length}
                </span>
              </button>
              <div
                className="timeline-lane"
                onClick={scrubTimeline}
                role="presentation"
              >
                <div
                  className="timeline-lane-fill"
                  style={{ width: `${laneProgress}%` }}
                />
                <div
                  className="timeline-playhead"
                  style={{ left: `${laneProgress}%` }}
                />
                {layer.keyframes.map((keyframe, index) => (
                  <button
                    key={`${layer.id}-${keyframe.frame}-${index}`}
                    type="button"
                    className={`timeline-keyframe ${keyframe.frame === frame ? "timeline-keyframe-current" : ""}`}
                    style={{
                      left: `${((keyframe.frame - 1) / (editor.duration - 1)) * 100}%`,
                    }}
                    title={`${layer.label} · frame ${keyframe.frame}`}
                    aria-label={`Go to ${layer.label} keyframe at frame ${keyframe.frame}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedLayerId(layer.id);
                      setFrame(keyframe.frame);
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="timeline-footer">
        <span>Drag the playhead or choose a diamond to edit a moment.</span>
        <span>
          <kbd>←</kbd>
          <kbd>→</kbd> step frame <i>·</i> <kbd>K</kbd> add keyframe
        </span>
      </div>
    </section>
  );
}
