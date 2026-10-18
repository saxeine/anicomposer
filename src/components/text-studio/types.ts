export type LayerId = "headline" | "body" | "byline";
export type ThemeId = "paper" | "night" | "sky" | "rose" | "moss";
export type MotionPreset =
  "fade-up" | "typewriter" | "word-by-word" | "float" | "pop";
export type Easing =
  "linear" | "ease-in" | "ease-out" | "ease-in-out" | "bounce" | "hold";
export type Align = "left" | "center" | "right";
export type FontChoice = "serif" | "sans" | "display";
export type PoseProperty = "x" | "y" | "opacity" | "scale";
export type SubmissionStatus = "draft" | "submitted";
export type ColorMode = "light" | "dark";
export type ThemePreference = ColorMode | "system";

export interface Keyframe {
  frame: number;
  x: number;
  y: number;
  opacity: number;
  scale: number;
  easing: Easing;
}

export type Pose = Pick<Keyframe, PoseProperty>;

export interface TextLayer {
  id: LayerId;
  label: string;
  text: string;
  visible: boolean;
  fontSize: number;
  font: FontChoice;
  weight: number;
  align: Align;
  color: string | null;
  preset: MotionPreset;
  baseY: number;
  keyframes: Keyframe[];
}

export interface EditorSettings {
  layers: TextLayer[];
  themeId: ThemeId;
  duration: number;
  fps: number;
  strobe: boolean;
  onion: boolean;
  onionOpacity: number;
  autoKeyframe: boolean;
}

export interface StageTheme {
  name: string;
  bg: string;
  ink: string;
  accent: string;
  description: string;
}

export interface SavedSubmission {
  id: string;
  title: string;
  content: string;
  author: string;
  status: SubmissionStatus;
  preset: string;
  settings: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionPayload {
  id?: string;
  title: string;
  content: string;
  author: string;
  status: SubmissionStatus;
  preset: MotionPreset;
  settings: EditorSettings;
}

/** Implement this adapter to connect the studio to an existing application's API. */
export interface SubmissionAdapter {
  list(): Promise<SavedSubmission[]>;
  save(submission: SubmissionPayload): Promise<SavedSubmission>;
  remove(id: string): Promise<void>;
}

export interface TextSubmissionStudioProps {
  /** Compact, container-responsive layout with no page intro or footer. */
  embedded?: boolean;
  className?: string;
  /** Seed values read on mount. Change the component's React key to load new values. */
  initialSubmission?: Partial<SubmissionPayload>;
  /** Defaults to the included PostgreSQL-backed /api/submissions endpoints. */
  apiEndpoint?: string;
  /** Overrides apiEndpoint; useful for integrating with another component's service. */
  adapter?: SubmissionAdapter;
  onChange?: (submission: SubmissionPayload) => void;
  onSave?: (submission: SavedSubmission) => void;
  onSubmit?: (submission: SavedSubmission) => void;
  /** Supply theme to control appearance from a parent component. */
  theme?: ColorMode;
  /** Used when no preference has been saved. Defaults to system. */
  defaultTheme?: ThemePreference;
  onThemeChange?: (theme: ColorMode) => void;
  /** Give instances different keys to persist their themes independently. */
  themeStorageKey?: string;
}
