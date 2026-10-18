import type {
  Easing,
  LayerId,
  MotionPreset,
  StageTheme as Theme,
  ThemeId,
} from "./types";

export const themes: Record<ThemeId, Theme> = {
  paper: {
    name: "Warm paper",
    bg: "#f2ecdf",
    ink: "#282720",
    accent: "#b75c45",
    description: "Warm, editorial",
  },
  night: {
    name: "After hours",
    bg: "#20232c",
    ink: "#f5f0e7",
    accent: "#e3bd79",
    description: "Quiet contrast",
  },
  sky: {
    name: "Open sky",
    bg: "#dce8ea",
    ink: "#263f48",
    accent: "#508796",
    description: "Cool & clear",
  },
  rose: {
    name: "Soft rose",
    bg: "#f0e0df",
    ink: "#50383a",
    accent: "#b9606c",
    description: "Gentle warmth",
  },
  moss: {
    name: "Field notes",
    bg: "#e7e8dc",
    ink: "#343b2e",
    accent: "#70804f",
    description: "Grounded & calm",
  },
};

export const presetInfo: Record<
  MotionPreset,
  { label: string; description: string }
> = {
  "fade-up": { label: "Fade up", description: "Soft entrance" },
  typewriter: { label: "Type on", description: "One character at a time" },
  "word-by-word": { label: "By word", description: "A paced reveal" },
  float: { label: "Float in", description: "Drift into place" },
  pop: { label: "Pop in", description: "A little emphasis" },
};

export const easingOptions: { id: Easing; label: string }[] = [
  { id: "linear", label: "Linear" },
  { id: "ease-in", label: "Ease in" },
  { id: "ease-out", label: "Ease out" },
  { id: "ease-in-out", label: "Ease in / out" },
  { id: "bounce", label: "Bounce" },
  { id: "hold", label: "Hold" },
];

export const initialFrameCount = 72;
export const supportedDurations = [72, 120, 192];
export const layerMeta: Record<
  LayerId,
  { number: string; label: string; placeholder: string }
> = {
  headline: {
    number: "01",
    label: "Headline",
    placeholder: "Add a short title…",
  },
  body: {
    number: "02",
    label: "Submission text",
    placeholder: "Write the words you want to share…",
  },
  byline: {
    number: "03",
    label: "Byline",
    placeholder: "Add your name or leave it blank…",
  },
};
