import {
  easingOptions,
  initialFrameCount,
  presetInfo,
  supportedDurations,
  themes,
} from "./config";
import type {
  Align,
  Easing,
  EditorSettings,
  FontChoice,
  Keyframe,
  MotionPreset,
  Pose,
  TextLayer,
  ThemeId,
} from "./types";

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function makeKeyframes(
  baseY: number,
  startFrame: number,
  endFrame: number,
  duration = initialFrameCount,
): Keyframe[] {
  const hidden: Keyframe = {
    frame: 1,
    x: 50,
    y: baseY + 8,
    opacity: 0,
    scale: 0.97,
    easing: "ease-out",
  };
  const visible: Keyframe = {
    frame: endFrame,
    x: 50,
    y: baseY,
    opacity: 1,
    scale: 1,
    easing: "ease-out",
  };
  const keys = [hidden];
  if (startFrame > 1) keys.push({ ...hidden, frame: startFrame });
  keys.push(visible, { ...visible, frame: duration, easing: "linear" });
  return keys.sort((a, b) => a.frame - b.frame);
}

export function makeInitialEditor(): EditorSettings {
  return {
    layers: [
      {
        id: "headline",
        label: "Headline",
        text: "Keep a little\nlight close.",
        visible: true,
        fontSize: 108,
        font: "serif",
        weight: 500,
        align: "center",
        color: null,
        preset: "fade-up",
        baseY: 34,
        keyframes: makeKeyframes(34, 1, 24),
      },
      {
        id: "body",
        label: "Submission text",
        text: "Even on the ordinary days, there is something worth noticing: a hand held open, a window catching the sun, a reason to begin again.",
        visible: true,
        fontSize: 39,
        font: "sans",
        weight: 400,
        align: "center",
        color: null,
        preset: "word-by-word",
        baseY: 58,
        keyframes: makeKeyframes(58, 11, 34),
      },
      {
        id: "byline",
        label: "Byline",
        text: "A note from Maya",
        visible: true,
        fontSize: 25,
        font: "sans",
        weight: 600,
        align: "center",
        color: null,
        preset: "fade-up",
        baseY: 83,
        keyframes: makeKeyframes(83, 34, 51),
      },
    ],
    themeId: "paper",
    duration: initialFrameCount,
    fps: 24,
    strobe: false,
    onion: false,
    onionOpacity: 0.28,
    autoKeyframe: true,
  };
}

export function easeProgress(progress: number, easing: Easing): number {
  const t = clamp(progress, 0, 1);
  if (easing === "hold") return t >= 1 ? 1 : 0;
  if (easing === "ease-in") return t * t;
  if (easing === "ease-out") return t * (2 - t);
  if (easing === "ease-in-out")
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  if (easing === "bounce") {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) {
      const shifted = t - 1.5 / d1;
      return n1 * shifted * shifted + 0.75;
    }
    if (t < 2.5 / d1) {
      const shifted = t - 2.25 / d1;
      return n1 * shifted * shifted + 0.9375;
    }
    const shifted = t - 2.625 / d1;
    return n1 * shifted * shifted + 0.984375;
  }
  return t;
}

export function poseAt(layer: TextLayer, frame: number): Pose {
  const keys = [...layer.keyframes].sort((a, b) => a.frame - b.frame);
  if (keys.length === 0) return { x: 50, y: layer.baseY, opacity: 1, scale: 1 };
  if (frame <= keys[0].frame) return keys[0];

  for (let index = 0; index < keys.length - 1; index += 1) {
    const from = keys[index];
    const to = keys[index + 1];
    if (frame === to.frame) return to;
    if (frame < to.frame) {
      const raw = (frame - from.frame) / Math.max(1, to.frame - from.frame);
      const amount = easeProgress(raw, from.easing);
      return {
        x: from.x + (to.x - from.x) * amount,
        y: from.y + (to.y - from.y) * amount,
        opacity: from.opacity + (to.opacity - from.opacity) * amount,
        scale: from.scale + (to.scale - from.scale) * amount,
      };
    }
  }

  return keys[keys.length - 1];
}

export function revealProgress(layer: TextLayer, frame: number) {
  const keys = [...layer.keyframes].sort((a, b) => a.frame - b.frame);
  const firstVisible = keys.find((key) => key.opacity >= 0.99);
  if (!firstVisible) return 1;
  const hiddenBefore = keys
    .filter((key) => key.frame <= firstVisible.frame && key.opacity <= 0.01)
    .at(-1);
  const start = hiddenBefore?.frame ?? keys[0]?.frame ?? 1;
  return clamp((frame - start) / Math.max(1, firstVisible.frame - start), 0, 1);
}

export function textForFrame(layer: TextLayer, frame: number) {
  if (layer.preset === "typewriter") {
    return layer.text.slice(
      0,
      Math.ceil(layer.text.length * revealProgress(layer, frame)),
    );
  }
  if (layer.preset === "word-by-word") {
    const progress = revealProgress(layer, frame);
    const words = layer.text.split(/(\s+)/);
    let visibleWords = 0;
    return words
      .map((part) => {
        if (/^\s+$/.test(part)) return part;
        const visible =
          visibleWords <
          Math.ceil(progress * layer.text.trim().split(/\s+/).length);
        visibleWords += 1;
        return visible ? part : "";
      })
      .join("");
  }
  return layer.text;
}

export function makeLayerKeyframe(
  layer: TextLayer,
  frame: number,
  pose: Pose,
): Keyframe[] {
  const keyframe: Keyframe = { frame, ...pose, easing: "ease-out" };
  return [
    ...layer.keyframes.filter((item) => item.frame !== frame),
    keyframe,
  ].sort((a, b) => a.frame - b.frame);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function restoreEditorSettings(
  value: unknown,
  content: string,
  author: string,
): EditorSettings {
  const fallback = makeInitialEditor();
  if (!isRecord(value)) {
    return {
      ...fallback,
      layers: fallback.layers.map((layer) =>
        layer.id === "body"
          ? { ...layer, text: content }
          : layer.id === "byline"
            ? { ...layer, text: author }
            : layer,
      ),
    };
  }

  const savedLayers = Array.isArray(value.layers)
    ? value.layers.filter(isRecord)
    : [];
  const layers = fallback.layers
    .map((defaultLayer) => {
      const saved = savedLayers.find((item) => item.id === defaultLayer.id);
      if (!saved) return defaultLayer;

      const validKeys: Keyframe[] = Array.isArray(saved.keyframes)
        ? saved.keyframes.flatMap((rawKey) => {
            if (!isRecord(rawKey) || typeof rawKey.frame !== "number")
              return [];
            const easing = easingOptions.some(
              (item) => item.id === rawKey.easing,
            )
              ? (rawKey.easing as Easing)
              : "ease-out";
            return [
              {
                frame: clamp(Math.round(rawKey.frame), 1, 192),
                x: typeof rawKey.x === "number" ? clamp(rawKey.x, 0, 100) : 50,
                y:
                  typeof rawKey.y === "number"
                    ? clamp(rawKey.y, 0, 100)
                    : defaultLayer.baseY,
                opacity:
                  typeof rawKey.opacity === "number"
                    ? clamp(rawKey.opacity, 0, 1)
                    : 1,
                scale:
                  typeof rawKey.scale === "number"
                    ? clamp(rawKey.scale, 0.2, 2)
                    : 1,
                easing,
              },
            ];
          })
        : [];
      const font = ["serif", "sans", "display"].includes(String(saved.font))
        ? (saved.font as FontChoice)
        : defaultLayer.font;
      const align = ["left", "center", "right"].includes(String(saved.align))
        ? (saved.align as Align)
        : defaultLayer.align;
      const preset = presetInfo[String(saved.preset) as MotionPreset]
        ? (saved.preset as MotionPreset)
        : defaultLayer.preset;
      const color =
        typeof saved.color === "string" && /^#[\da-f]{6}$/i.test(saved.color)
          ? saved.color
          : null;

      return {
        ...defaultLayer,
        text:
          typeof saved.text === "string"
            ? saved.text.slice(0, 5000)
            : defaultLayer.text,
        visible:
          typeof saved.visible === "boolean"
            ? saved.visible
            : defaultLayer.visible,
        fontSize:
          typeof saved.fontSize === "number"
            ? clamp(saved.fontSize, 16, 160)
            : defaultLayer.fontSize,
        font,
        weight:
          typeof saved.weight === "number"
            ? clamp(saved.weight, 300, 900)
            : defaultLayer.weight,
        align,
        color,
        preset,
        keyframes: validKeys.length
          ? validKeys.sort((a, b) => a.frame - b.frame)
          : defaultLayer.keyframes,
      };
    })
    .map((layer) => {
      if (
        layer.id === "body" &&
        !savedLayers.some((item) => item.id === "body")
      )
        return { ...layer, text: content };
      if (
        layer.id === "byline" &&
        !savedLayers.some((item) => item.id === "byline")
      )
        return { ...layer, text: author };
      return layer;
    });

  const themeId =
    typeof value.themeId === "string" &&
    Object.prototype.hasOwnProperty.call(themes, value.themeId)
      ? (value.themeId as ThemeId)
      : fallback.themeId;
  const duration =
    typeof value.duration === "number" &&
    supportedDurations.includes(value.duration)
      ? value.duration
      : fallback.duration;

  return {
    layers,
    themeId,
    duration,
    fps:
      typeof value.fps === "number"
        ? clamp(Math.round(value.fps), 12, 60)
        : fallback.fps,
    strobe: typeof value.strobe === "boolean" ? value.strobe : fallback.strobe,
    onion: typeof value.onion === "boolean" ? value.onion : fallback.onion,
    onionOpacity:
      typeof value.onionOpacity === "number"
        ? clamp(value.onionOpacity, 0.1, 0.8)
        : fallback.onionOpacity,
    autoKeyframe:
      typeof value.autoKeyframe === "boolean"
        ? value.autoKeyframe
        : fallback.autoKeyframe,
  };
}
