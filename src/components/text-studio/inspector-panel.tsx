"use client";

import { useTextStudio } from "./studio-context";
import { StudioIcon as Icon } from "./studio-icon";
import { easingOptions, layerMeta, presetInfo, themes } from "./config";
import type {
  Align,
  Easing,
  FontChoice,
  MotionPreset,
  StageTheme as Theme,
  ThemeId,
} from "./types";

export function InspectorPanel() {
  const {
    editor,
    frame,
    activeLayer,
    activePose,
    theme,
    inspectorTab,
    setInspectorTab,
    selectedEasing,
    updateLayerStyle,
    applyPreset,
    updateEasing,
    updatePoseProperty,
    updateEditor,
    changeTheme,
    idFor,
  } = useTextStudio();
  return (
    <aside className="right-panel">
      <div className="panel-heading inspector-heading">
        <div className="panel-title-wrap">
          <span className="panel-kicker">THE DETAILS</span>
          <h2>Inspector</h2>
        </div>
        <button
          className={`inspector-eye ${activeLayer.visible ? "" : "inspector-eye-off"}`}
          type="button"
          onClick={() =>
            updateLayerStyle(activeLayer.id, { visible: !activeLayer.visible })
          }
          aria-label={
            activeLayer.visible ? "Hide selected layer" : "Show selected layer"
          }
        >
          <Icon name={activeLayer.visible ? "eye" : "eyeOff"} size={16} />
        </button>
      </div>

      <div className="selected-layer-card">
        <span className="selected-layer-icon">
          <Icon name="type" size={17} />
        </span>
        <span>
          <small>SELECTED TEXT LAYER</small>
          <strong>{activeLayer.label}</strong>
        </span>
        <span className="selected-layer-number">
          {layerMeta[activeLayer.id].number}
        </span>
      </div>

      <div
        className="inspector-tabs"
        role="tablist"
        aria-label="Inspector settings"
      >
        <button
          className={inspectorTab === "motion" ? "inspector-tab-active" : ""}
          type="button"
          role="tab"
          aria-selected={inspectorTab === "motion"}
          onClick={() => setInspectorTab("motion")}
        >
          <Icon name="sparkle" size={14} /> Motion
        </button>
        <button
          className={inspectorTab === "type" ? "inspector-tab-active" : ""}
          type="button"
          role="tab"
          aria-selected={inspectorTab === "type"}
          onClick={() => setInspectorTab("type")}
        >
          <Icon name="type" size={14} /> Type
        </button>
      </div>

      {inspectorTab === "motion" ? (
        <div className="inspector-content">
          <div className="inspector-section-title">
            <span>ENTRANCE PRESET</span>
            <span className="tiny-help">Choose a rhythm</span>
          </div>
          <div className="preset-grid">
            {(
              [
                "fade-up",
                "typewriter",
                "word-by-word",
                "float",
                "pop",
              ] as MotionPreset[]
            ).map((preset) => (
              <button
                key={preset}
                type="button"
                className={`preset-card ${activeLayer.preset === preset ? "preset-card-active" : ""}`}
                onClick={() => applyPreset(preset)}
              >
                <span className={`preset-glyph preset-glyph-${preset}`}>
                  <i />
                  <i />
                  <i />
                </span>
                <span className="preset-card-name">
                  {presetInfo[preset].label}
                </span>
                {activeLayer.preset === preset ? (
                  <span className="preset-check">
                    <Icon name="check" size={10} />
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          <div className="inspector-control-block">
            <div className="control-label-row">
              <label htmlFor={idFor("easing-select")}>Easing curve</label>
              <span className="control-value-label">KEYFRAME</span>
            </div>
            <div className="select-frame">
              <select
                id={idFor("easing-select")}
                value={selectedEasing}
                onChange={(event) => updateEasing(event.target.value as Easing)}
              >
                {easingOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Icon name="chevron" size={13} />
            </div>
          </div>

          <div className="inspector-section-title property-title">
            <span>TRANSFORM AT FRAME {String(frame).padStart(2, "0")}</span>
            <span className="property-unit">%</span>
          </div>
          <div className="range-control">
            <div className="range-label">
              <label htmlFor={idFor("position-x")}>Position X</label>
              <output>{Math.round(activePose.x)}%</output>
            </div>
            <input
              id={idFor("position-x")}
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(activePose.x)}
              onChange={(event) =>
                updatePoseProperty("x", Number(event.target.value))
              }
            />
          </div>
          <div className="range-control">
            <div className="range-label">
              <label htmlFor={idFor("position-y")}>Position Y</label>
              <output>{Math.round(activePose.y)}%</output>
            </div>
            <input
              id={idFor("position-y")}
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(activePose.y)}
              onChange={(event) =>
                updatePoseProperty("y", Number(event.target.value))
              }
            />
          </div>
          <div className="range-control">
            <div className="range-label">
              <label htmlFor={idFor("opacity-control")}>Opacity</label>
              <output>{Math.round(activePose.opacity * 100)}%</output>
            </div>
            <input
              id={idFor("opacity-control")}
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={activePose.opacity}
              onChange={(event) =>
                updatePoseProperty("opacity", Number(event.target.value))
              }
            />
          </div>
          <div className="range-control">
            <div className="range-label">
              <label htmlFor={idFor("scale-control")}>Scale</label>
              <output>{activePose.scale.toFixed(2)}×</output>
            </div>
            <input
              id={idFor("scale-control")}
              type="range"
              min={0.2}
              max={2}
              step={0.01}
              value={activePose.scale}
              onChange={(event) =>
                updatePoseProperty("scale", Number(event.target.value))
              }
            />
          </div>

          <button
            className={`auto-keyframe-row ${editor.autoKeyframe ? "auto-keyframe-on" : ""}`}
            type="button"
            onClick={() => updateEditor({ autoKeyframe: !editor.autoKeyframe })}
            aria-pressed={editor.autoKeyframe}
          >
            <span className="auto-keyframe-symbol">◇</span>
            <span className="auto-keyframe-copy">
              <strong>Auto-keyframe</strong>
              <small>
                {editor.autoKeyframe
                  ? "Changes add a key here"
                  : "Changes affect every key"}
              </small>
            </span>
            <span className="switch-track">
              <i />
            </span>
          </button>

          <div className="onion-control">
            <div className="onion-control-heading">
              <div>
                <strong>Onion skin</strong>
                <span>Ghost nearby frames</span>
              </div>
              <button
                type="button"
                className={`switch-button ${editor.onion ? "switch-button-on" : ""}`}
                aria-label="Toggle onion skin"
                aria-pressed={editor.onion}
                onClick={() => updateEditor({ onion: !editor.onion })}
              >
                <i />
              </button>
            </div>
            <div
              className={`range-control onion-opacity-control ${editor.onion ? "" : "range-disabled"}`}
            >
              <div className="range-label">
                <label htmlFor={idFor("onion-opacity")}>Ghost opacity</label>
                <output>{Math.round(editor.onionOpacity * 100)}%</output>
              </div>
              <input
                id={idFor("onion-opacity")}
                type="range"
                min={0.1}
                max={0.8}
                step={0.01}
                value={editor.onionOpacity}
                disabled={!editor.onion}
                onChange={(event) =>
                  updateEditor({ onionOpacity: Number(event.target.value) })
                }
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="inspector-content type-content">
          <div className="inspector-section-title">
            <span>TYPOGRAPHY</span>
            <span className="tiny-help">Text only</span>
          </div>
          <label className="control-label" htmlFor={idFor("font-select")}>
            Font family
          </label>
          <div className="select-frame font-select-frame">
            <select
              id={idFor("font-select")}
              value={activeLayer.font}
              onChange={(event) =>
                updateLayerStyle(activeLayer.id, {
                  font: event.target.value as FontChoice,
                })
              }
            >
              <option value="serif">Editorial Serif</option>
              <option value="sans">Modern Sans</option>
              <option value="display">Mono Display</option>
            </select>
            <Icon name="chevron" size={13} />
          </div>

          <div className="range-control font-size-control">
            <div className="range-label">
              <label htmlFor={idFor("font-size")}>Size</label>
              <output>{activeLayer.fontSize}px</output>
            </div>
            <input
              id={idFor("font-size")}
              type="range"
              min={16}
              max={150}
              step={1}
              value={activeLayer.fontSize}
              onChange={(event) =>
                updateLayerStyle(activeLayer.id, {
                  fontSize: Number(event.target.value),
                })
              }
            />
          </div>
          <div className="type-control-row">
            <span className="control-label">Weight</span>
            <div className="weight-options">
              {[400, 600, 800].map((weight) => (
                <button
                  className={
                    activeLayer.weight === weight ? "weight-active" : ""
                  }
                  type="button"
                  key={weight}
                  onClick={() => updateLayerStyle(activeLayer.id, { weight })}
                >
                  <span style={{ fontWeight: weight }}>B</span>
                </button>
              ))}
            </div>
          </div>
          <div className="type-control-row">
            <span className="control-label">Alignment</span>
            <div className="alignment-options">
              {(["left", "center", "right"] as Align[]).map((align) => (
                <button
                  type="button"
                  key={align}
                  className={
                    activeLayer.align === align ? "alignment-active" : ""
                  }
                  aria-label={`Align ${align}`}
                  onClick={() => updateLayerStyle(activeLayer.id, { align })}
                >
                  <Icon
                    name={
                      align === "left"
                        ? "alignLeft"
                        : align === "center"
                          ? "alignCenter"
                          : "alignRight"
                    }
                    size={16}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="color-control-block">
            <span className="control-label">Text color</span>
            <label className="color-picker-row">
              <span
                className="color-swatch"
                style={{ backgroundColor: activeLayer.color ?? theme.ink }}
              />
              <span>{activeLayer.color ?? "Theme default"}</span>
              <input
                aria-label="Text color"
                type="color"
                value={activeLayer.color ?? theme.ink}
                onChange={(event) =>
                  updateLayerStyle(activeLayer.id, {
                    color: event.target.value,
                  })
                }
              />
            </label>
            <button
              className="reset-color"
              type="button"
              onClick={() => updateLayerStyle(activeLayer.id, { color: null })}
            >
              Reset to theme color
            </button>
          </div>

          <div className="inspector-section-title theme-heading">
            <span>STAGE PALETTE</span>
            <span className="tiny-help">Background & accent</span>
          </div>
          <div className="theme-list">
            {(Object.entries(themes) as [ThemeId, Theme][]).map(
              ([id, option]) => (
                <button
                  key={id}
                  className={`theme-swatch-option ${editor.themeId === id ? "theme-swatch-active" : ""}`}
                  type="button"
                  title={option.name}
                  aria-label={`Use ${option.name} palette`}
                  aria-pressed={editor.themeId === id}
                  onClick={() => changeTheme(id)}
                >
                  <span className="theme-swatch-colors">
                    <i style={{ background: option.bg }} />
                    <i style={{ background: option.ink }} />
                    <i style={{ background: option.accent }} />
                  </span>
                  <span className="theme-swatch-name">{option.name}</span>
                  {editor.themeId === id ? (
                    <Icon name="check" size={12} />
                  ) : null}
                </button>
              ),
            )}
          </div>
        </div>
      )}

      <div className="inspector-bottom-note">
        <Icon name="sparkle" size={14} />
        <span>Every layer here is text — no assets, just your words.</span>
      </div>
    </aside>
  );
}
