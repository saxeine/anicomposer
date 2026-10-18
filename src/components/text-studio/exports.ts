import { themes } from "./config";
import { poseAt, textForFrame } from "./animation";
import type { EditorSettings } from "./types";

export function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const paragraphs = text.split("\n");
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word;
      if (line && context.measureText(trial).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = trial;
      }
    }
    lines.push(line);
  }
  return lines;
}

export function drawExportFrame(
  context: CanvasRenderingContext2D,
  frame: number,
  editor: EditorSettings,
) {
  const width = context.canvas.width;
  const height = context.canvas.height;
  const theme = themes[editor.themeId];
  const flash = editor.strobe && Math.floor((frame - 1) / 2) % 2 === 1;
  const background = flash ? theme.accent : theme.bg;
  const ink = flash ? theme.bg : theme.ink;
  context.clearRect(0, 0, width, height);
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = flash ? theme.bg : theme.accent;
  context.globalAlpha = 0.22;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(64, 62);
  context.lineTo(width - 64, 62);
  context.moveTo(64, height - 62);
  context.lineTo(width - 64, height - 62);
  context.stroke();
  context.globalAlpha = 1;

  for (const layer of editor.layers) {
    if (!layer.visible || !layer.text.trim()) continue;
    const pose = poseAt(layer, frame);
    if (pose.opacity <= 0.001) continue;
    const text = textForFrame(layer, frame);
    if (!text) continue;
    const fontSize = layer.fontSize * (width / 1920);
    const family =
      layer.font === "serif"
        ? "Georgia, serif"
        : layer.font === "display"
          ? "Arial Black, sans-serif"
          : "Arial, sans-serif";
    context.save();
    context.globalAlpha = pose.opacity;
    context.translate((pose.x / 100) * width, (pose.y / 100) * height);
    context.scale(pose.scale, pose.scale);
    context.fillStyle = layer.color ?? ink;
    context.font = `${layer.weight} ${fontSize}px ${family}`;
    context.textBaseline = "middle";
    context.textAlign = layer.align;
    const maxWidth = width * 0.8;
    const textX =
      layer.align === "left"
        ? -maxWidth / 2
        : layer.align === "right"
          ? maxWidth / 2
          : 0;
    const lines = wrapCanvasText(context, text, maxWidth);
    const lineHeight = fontSize * (layer.id === "headline" ? 1.08 : 1.42);
    const firstY = -((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) =>
      context.fillText(line, textX, firstY + index * lineHeight, maxWidth),
    );
    context.restore();
  }
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

/** Browser-only, real-time WebM encoder. Workspace appearance never changes the canvas palette. */
export async function exportAnimatedWebm(
  editor: EditorSettings,
  signal?: AbortSignal,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 608;
  const context = canvas.getContext("2d");
  if (
    !context ||
    typeof canvas.captureStream !== "function" ||
    typeof MediaRecorder === "undefined"
  ) {
    throw new Error("WebM recording is not supported in this browser.");
  }
  await document.fonts?.ready;
  if (signal?.aborted) throw new DOMException("Export canceled", "AbortError");
  const mimeType = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ].find((type) => MediaRecorder.isTypeSupported(type));
  if (!mimeType)
    throw new Error(
      "This browser cannot export WebM. Try Chrome, Edge, or Firefox.",
    );
  const stream = canvas.captureStream(editor.fps);
  let recorder: MediaRecorder | undefined;
  try {
    recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 4_000_000,
    });
    const encoder = recorder;
    const chunks: BlobPart[] = [];
    let encodingError: Error | undefined;
    const finished = new Promise<void>((resolve) => {
      encoder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      encoder.onerror = () => {
        encodingError = new Error("The WebM recording failed.");
        resolve();
      };
      encoder.onstop = () => resolve();
    });
    encoder.start();
    for (let frame = 1; frame <= editor.duration; frame += 1) {
      if (signal?.aborted)
        throw new DOMException("Export canceled", "AbortError");
      if (encodingError) throw encodingError;
      drawExportFrame(context, frame, editor);
      await new Promise<void>((resolve) =>
        window.setTimeout(resolve, 1000 / editor.fps),
      );
    }
    if (encoder.state !== "inactive") encoder.stop();
    await finished;
    if (encodingError) throw encodingError;
    return new Blob(chunks, { type: encoder.mimeType || mimeType });
  } finally {
    if (recorder && recorder.state !== "inactive") recorder.stop();
    stream.getTracks().forEach((track) => track.stop());
  }
}
