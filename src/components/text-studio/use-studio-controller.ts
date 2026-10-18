"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import {
  clamp,
  makeInitialEditor,
  makeLayerKeyframe,
  poseAt,
  restoreEditorSettings,
} from "./animation";
import { supportedDurations, themes } from "./config";
import { exportAnimatedWebm, saveBlob } from "./exports";
import { slugify } from "./format";
import { createHttpSubmissionAdapter } from "./submission-service";
import type {
  Easing,
  EditorSettings,
  Keyframe,
  LayerId,
  MotionPreset,
  PoseProperty,
  SavedSubmission,
  SubmissionPayload,
  SubmissionStatus,
  TextLayer,
  TextSubmissionStudioProps,
  ThemeId,
} from "./types";

type ControllerOptions = Pick<
  TextSubmissionStudioProps,
  | "initialSubmission"
  | "apiEndpoint"
  | "adapter"
  | "onChange"
  | "onSave"
  | "onSubmit"
>;

export function useStudioController({
  initialSubmission,
  apiEndpoint = "/api/submissions",
  adapter,
  onChange,
  onSave,
  onSubmit,
}: ControllerOptions = {}) {
  const [editor, setEditor] = useState<EditorSettings>(() => {
    const defaults = makeInitialEditor();
    return initialSubmission
      ? restoreEditorSettings(
          initialSubmission.settings,
          initialSubmission.content ?? defaults.layers[1].text,
          initialSubmission.author ?? defaults.layers[2].text,
        )
      : defaults;
  });
  const [frame, setFrame] = useState(54);
  const [selectedLayerId, setSelectedLayerId] = useState<LayerId>("body");
  const [inspectorTab, setInspectorTab] = useState<"motion" | "type">("motion");
  const [submissionTitle, setSubmissionTitle] = useState(
    initialSubmission?.title ?? "A note to keep",
  );
  const [submissionId, setSubmissionId] = useState<string | null>(
    initialSubmission?.id ?? null,
  );
  const [recordStatus, setRecordStatus] = useState<SubmissionStatus>(
    initialSubmission?.status ?? "draft",
  );
  const [submissions, setSubmissions] = useState<SavedSubmission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDirty, setIsDirty] = useState(!initialSubmission?.id);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [notice, setNotice] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [loadError, setLoadError] = useState("");
  const revision = useRef(0);
  const exportAbort = useRef<AbortController | null>(null);
  const callbacks = useRef({ onChange, onSave, onSubmit });

  useEffect(() => {
    callbacks.current = { onChange, onSave, onSubmit };
  }, [onChange, onSave, onSubmit]);
  useEffect(() => () => exportAbort.current?.abort(), []);

  const persistence = useMemo(
    () => adapter ?? createHttpSubmissionAdapter(apiEndpoint),
    [adapter, apiEndpoint],
  );
  const activeLayer =
    editor.layers.find((layer) => layer.id === selectedLayerId) ??
    editor.layers[1];
  const activePose = poseAt(activeLayer, frame);
  const theme = themes[editor.themeId];
  const stageFlash = editor.strobe && Math.floor((frame - 1) / 2) % 2 === 1;
  const stageInk = stageFlash ? theme.bg : theme.ink;
  const messageLayer =
    editor.layers.find((layer) => layer.id === "body") ?? editor.layers[1];
  const headlineLayer =
    editor.layers.find((layer) => layer.id === "headline") ?? editor.layers[0];
  const bylineLayer =
    editor.layers.find((layer) => layer.id === "byline") ?? editor.layers[2];
  const currentTextLength = activeLayer.text.length;
  const themeStyle = {
    "--stage-accent": theme.accent,
    "--stage-ink": stageInk,
  } as CSSProperties;

  const project = useMemo<SubmissionPayload>(
    () => ({
      id: submissionId ?? undefined,
      title: submissionTitle,
      content: messageLayer.text,
      author: bylineLayer.text,
      status: recordStatus,
      preset: messageLayer.preset,
      settings: editor,
    }),
    [
      submissionId,
      submissionTitle,
      messageLayer.text,
      messageLayer.preset,
      bylineLayer.text,
      recordStatus,
      editor,
    ],
  );

  useEffect(() => {
    callbacks.current.onChange?.(project);
  }, [project]);

  const loadSubmissions = useCallback(async () => {
    setIsLoadingSubmissions(true);
    try {
      setSubmissions(await persistence.list());
      setLoadError("");
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Submissions could not be loaded.",
      );
    } finally {
      setIsLoadingSubmissions(false);
    }
  }, [persistence]);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setFrame((current) => (current >= editor.duration ? 1 : current + 1));
    }, 1000 / editor.fps);
    return () => window.clearInterval(timer);
  }, [editor.duration, editor.fps, isPlaying]);

  function markEdited() {
    revision.current += 1;
    setIsDirty(true);
    setNotice("");
    setRecordStatus("draft");
  }

  function updateEditor(patch: Partial<Omit<EditorSettings, "layers">>) {
    markEdited();
    setEditor((current) => ({ ...current, ...patch }));
  }

  function updateLayerText(id: LayerId, text: string) {
    markEdited();
    setEditor((current) => ({
      ...current,
      layers: current.layers.map((layer) =>
        layer.id === id ? { ...layer, text } : layer,
      ),
    }));
  }

  function updateLayerStyle(id: LayerId, patch: Partial<TextLayer>) {
    markEdited();
    setEditor((current) => ({
      ...current,
      layers: current.layers.map((layer) =>
        layer.id === id ? { ...layer, ...patch } : layer,
      ),
    }));
  }

  function updatePoseProperty(property: PoseProperty, value: number) {
    markEdited();
    setEditor((current) => ({
      ...current,
      layers: current.layers.map((layer) => {
        if (layer.id !== selectedLayerId) return layer;
        const pose = poseAt(layer, frame);
        if (current.autoKeyframe) {
          return {
            ...layer,
            keyframes: makeLayerKeyframe(layer, frame, {
              ...pose,
              [property]: value,
            }),
          };
        }
        const delta = value - pose[property];
        const limits: Record<PoseProperty, [number, number]> = {
          x: [0, 100],
          y: [0, 100],
          opacity: [0, 1],
          scale: [0.2, 2],
        };
        return {
          ...layer,
          keyframes: layer.keyframes.map((keyframe) => ({
            ...keyframe,
            [property]: clamp(
              keyframe[property] + delta,
              limits[property][0],
              limits[property][1],
            ),
          })),
        };
      }),
    }));
  }

  function insertKeyframe() {
    markEdited();
    setEditor((current) => ({
      ...current,
      layers: current.layers.map((layer) =>
        layer.id === selectedLayerId
          ? {
              ...layer,
              keyframes: makeLayerKeyframe(layer, frame, poseAt(layer, frame)),
            }
          : layer,
      ),
    }));
    setNotice(`Keyframe added at frame ${String(frame).padStart(2, "0")}.`);
  }

  function updateEasing(easing: Easing) {
    markEdited();
    setEditor((current) => ({
      ...current,
      layers: current.layers.map((layer) => {
        if (layer.id !== selectedLayerId) return layer;
        const earlier = layer.keyframes
          .filter((keyframe) => keyframe.frame <= frame)
          .at(-1);
        if (!earlier) return layer;
        return {
          ...layer,
          keyframes: layer.keyframes.map((keyframe) =>
            keyframe.frame === earlier.frame
              ? { ...keyframe, easing }
              : keyframe,
          ),
        };
      }),
    }));
  }

  function applyPreset(preset: MotionPreset) {
    markEdited();
    setEditor((current) => ({
      ...current,
      layers: current.layers.map((layer) => {
        if (layer.id !== selectedLayerId) return layer;
        const startFrame =
          layer.id === "body" ? 11 : layer.id === "byline" ? 34 : 1;
        const endFrame = Math.min(current.duration, startFrame + 20);
        const final: Keyframe = {
          frame: endFrame,
          x: 50,
          y: layer.baseY,
          opacity: 1,
          scale: 1,
          easing: preset === "pop" ? "bounce" : "ease-out",
        };
        const offset = preset === "float" ? 4 : preset === "pop" ? 0 : 9;
        const initial: Keyframe = {
          frame: Math.max(1, startFrame - 1),
          x: 50,
          y: layer.baseY + offset,
          opacity: 0,
          scale: preset === "pop" ? 0.72 : preset === "float" ? 1.02 : 0.97,
          easing: preset === "pop" ? "bounce" : "ease-out",
        };
        const keys: Keyframe[] = [initial];
        if (startFrame > 1) keys.push({ ...initial, frame: startFrame });
        keys.push(final, {
          ...final,
          frame: current.duration,
          easing: "linear",
        });
        return {
          ...layer,
          preset,
          keyframes: keys.sort((a, b) => a.frame - b.frame),
        };
      }),
    }));
  }

  function changeDuration(duration: number) {
    if (!supportedDurations.includes(duration)) return;
    markEdited();
    setFrame((current) => Math.min(current, duration));
    setEditor((current) => ({
      ...current,
      duration,
      layers: current.layers.map((layer) => {
        const deduplicated = new Map<number, Keyframe>();
        layer.keyframes.forEach((keyframe) => {
          const adjustedFrame =
            keyframe.frame === current.duration
              ? duration
              : Math.min(duration, keyframe.frame);
          deduplicated.set(adjustedFrame, {
            ...keyframe,
            frame: adjustedFrame,
          });
        });
        return {
          ...layer,
          keyframes: [...deduplicated.values()].sort(
            (a, b) => a.frame - b.frame,
          ),
        };
      }),
    }));
  }

  async function saveSubmission(status: SubmissionStatus) {
    if (isSaving) return;
    if (!submissionTitle.trim()) {
      setNotice("Give your text a submission title first.");
      return;
    }
    if (!messageLayer.text.trim()) {
      setSelectedLayerId("body");
      setNotice("Add your submission text before saving.");
      return;
    }
    setIsSaving(true);
    setNotice("");
    const savingRevision = revision.current;
    try {
      const saved = await persistence.save({
        ...project,
        title: submissionTitle.trim(),
        content: messageLayer.text.trim(),
        author: bylineLayer.text.trim(),
        status,
      });
      setSubmissionId(saved.id);
      const unchanged = savingRevision === revision.current;
      setRecordStatus(unchanged ? status : "draft");
      setIsDirty(!unchanged);
      setNotice(
        !unchanged
          ? "Draft saved. You have newer unsaved changes."
          : status === "submitted"
            ? "Your text has been submitted."
            : "Draft saved to your library.",
      );
      try {
        callbacks.current.onSave?.(saved);
        if (status === "submitted") callbacks.current.onSubmit?.(saved);
      } catch (error) {
        console.error("A studio integration callback failed:", error);
      }
      await loadSubmissions();
      return saved;
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Your text could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function openSubmission(item: SavedSubmission) {
    const restored = restoreEditorSettings(
      item.settings,
      item.content,
      item.author,
    );
    revision.current += 1;
    setSubmissionId(item.id);
    setSubmissionTitle(item.title);
    setRecordStatus(item.status === "submitted" ? "submitted" : "draft");
    setEditor(restored);
    setSelectedLayerId("body");
    setFrame(Math.min(54, restored.duration));
    setIsPlaying(false);
    setIsDirty(false);
    setNotice(`Opened “${item.title}”.`);
    setLibraryOpen(false);
  }

  async function removeSubmission(id: string) {
    if (!window.confirm("Delete this text submission? This cannot be undone."))
      return;
    try {
      await persistence.remove(id);
      setSubmissions((current) => current.filter((item) => item.id !== id));
      if (submissionId === id) {
        setSubmissionId(null);
        setSubmissionTitle("Untitled submission");
        setRecordStatus("draft");
        setIsDirty(true);
      }
      setNotice("Submission removed from your library.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "The submission could not be deleted.",
      );
    }
  }

  function exportText() {
    const text = [
      submissionTitle.trim(),
      headlineLayer.text.trim(),
      messageLayer.text.trim(),
      bylineLayer.text.trim(),
    ]
      .filter(Boolean)
      .join("\n\n");
    saveBlob(
      new Blob([`${text}\n`], { type: "text/plain;charset=utf-8" }),
      `${slugify(submissionTitle)}.txt`,
    );
    setNotice("Text submission downloaded as a .txt file.");
  }

  async function copyText() {
    const text = [
      headlineLayer.text.trim(),
      messageLayer.text.trim(),
      bylineLayer.text.trim(),
    ]
      .filter(Boolean)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Submission copied to your clipboard.");
      setExportOpen(false);
    } catch {
      setNotice(
        "Clipboard access is unavailable in this browser. Download the text file instead.",
      );
    }
  }

  function exportProjectFile() {
    const file = {
      format: "letterform-text-motion",
      version: 1,
      exportedAt: new Date().toISOString(),
      title: submissionTitle,
      status: recordStatus,
      text: {
        headline: headlineLayer.text,
        body: messageLayer.text,
        byline: bylineLayer.text,
      },
      animation: editor,
    };
    saveBlob(
      new Blob([JSON.stringify(file, null, 2)], {
        type: "application/json;charset=utf-8",
      }),
      `${slugify(submissionTitle)}-motion.json`,
    );
    setNotice("Motion project downloaded as JSON.");
  }

  async function exportWebm() {
    if (isExporting) return;
    setIsExporting(true);
    setNotice("");
    const abort = new AbortController();
    exportAbort.current = abort;
    try {
      const blob = await exportAnimatedWebm(editor, abort.signal);
      saveBlob(blob, `${slugify(submissionTitle)}.webm`);
      setNotice("Animated text clip exported as WebM.");
      setExportOpen(false);
    } catch (error) {
      if (!abort.signal.aborted)
        setNotice(
          error instanceof Error
            ? error.message
            : "The clip could not be exported.",
        );
    } finally {
      if (!abort.signal.aborted) setIsExporting(false);
      exportAbort.current = null;
    }
  }

  function changeTheme(id: ThemeId) {
    updateEditor({ themeId: id });
  }
  function chooseDuration(value: string) {
    changeDuration(Number(value));
  }
  function scrubTimeline(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = clamp(
      (event.clientX - rect.left) / Math.max(1, rect.width),
      0,
      1,
    );
    setFrame(Math.round(1 + ratio * (editor.duration - 1)));
  }

  const selectedEasing =
    activeLayer.keyframes.filter((keyframe) => keyframe.frame <= frame).at(-1)
      ?.easing ?? "ease-out";
  const recentSubmissions = submissions.slice(0, 4);
  const libraryCountLabel =
    submissions.length === 1 ? "1 piece" : `${submissions.length} pieces`;

  return {
    editor,
    setEditor,
    frame,
    setFrame,
    selectedLayerId,
    setSelectedLayerId,
    inspectorTab,
    setInspectorTab,
    submissionTitle,
    setSubmissionTitle,
    submissionId,
    recordStatus,
    submissions,
    isLoadingSubmissions,
    isPlaying,
    setIsPlaying,
    isDirty,
    isSaving,
    isExporting,
    notice,
    setNotice,
    libraryOpen,
    setLibraryOpen,
    exportOpen,
    setExportOpen,
    loadError,
    activeLayer,
    activePose,
    theme,
    stageFlash,
    stageInk,
    themeStyle,
    currentTextLength,
    selectedEasing,
    recentSubmissions,
    libraryCountLabel,
    project,
    markEdited,
    updateEditor,
    updateLayerText,
    updateLayerStyle,
    updatePoseProperty,
    insertKeyframe,
    updateEasing,
    applyPreset,
    changeDuration,
    saveSubmission,
    openSubmission,
    removeSubmission,
    exportText,
    copyText,
    exportProjectFile,
    exportWebm,
    changeTheme,
    chooseDuration,
    scrubTimeline,
    loadSubmissions,
  };
}

export type StudioController = ReturnType<typeof useStudioController>;
