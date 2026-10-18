"use client";

import type { CSSProperties } from "react";
import { clamp, poseAt, revealProgress } from "./animation";
import type { TextLayer } from "./types";

function TextContent({
  layer,
  frame,
  ghost = false,
}: {
  layer: TextLayer;
  frame: number;
  ghost?: boolean;
}) {
  if (ghost || !["typewriter", "word-by-word"].includes(layer.preset))
    return <>{layer.text}</>;
  const progress = revealProgress(layer, frame);
  if (layer.preset === "typewriter") {
    const visibleText = layer.text.slice(
      0,
      Math.ceil(layer.text.length * progress),
    );
    return (
      <>
        {visibleText}
        {progress > 0 && progress < 1 ? (
          <span className="typewriter-cursor">|</span>
        ) : null}
      </>
    );
  }

  const tokens = layer.text.match(/\s+|\S+/g) ?? [];
  const wordCount = Math.max(
    1,
    layer.text.trim().split(/\s+/).filter(Boolean).length,
  );
  return (
    <>
      {tokens.map((token, index) => {
        if (/^\s+$/.test(token))
          return <span key={`space-${index}`}>{token}</span>;
        const opacity = clamp(progress * wordCount - Math.floor(index / 2), 0, 1);
        return (
          <span
            key={`word-${index}`}
            style={{ opacity, filter: opacity < 1 ? "blur(1px)" : undefined }}
          >
            {token}
          </span>
        );
      })}
    </>
  );
}

export function StageLayer({
  layer,
  frame,
  themeInk,
  selected,
  ghost,
  ghostOpacity = 1,
  ghostColor,
}: {
  layer: TextLayer;
  frame: number;
  themeInk: string;
  selected?: boolean;
  ghost?: boolean;
  ghostOpacity?: number;
  ghostColor?: string;
}) {
  const pose = poseAt(layer, frame);
  const style: CSSProperties = {
    left: `${pose.x}%`,
    top: `${pose.y}%`,
    opacity: ghost ? pose.opacity * ghostOpacity : pose.opacity,
    transform: `translate(-50%, -50%) scale(${pose.scale})`,
    color: ghostColor ?? layer.color ?? themeInk,
    fontSize: `clamp(10px, ${layer.fontSize / 18}cqw, 78px)`,
    fontFamily:
      layer.font === "serif"
        ? "Georgia, 'Times New Roman', serif"
        : layer.font === "display"
          ? "'Arial Black', 'Franklin Gothic Heavy', sans-serif"
          : "Arial, Helvetica, sans-serif",
    fontWeight: layer.weight,
    textAlign: layer.align,
  };
  const classes = [
    "preview-text-layer",
    `preview-${layer.id}`,
    selected && !ghost ? "is-selected-layer" : "",
    ghost ? "preview-ghost" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} style={style} aria-hidden={ghost || undefined}>
      <TextContent layer={layer} frame={frame} ghost={ghost} />
    </div>
  );
}
