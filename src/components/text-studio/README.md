# Letterform text studio

A self-contained React/Next.js text-submission and animation editor with light/dark workspace themes, composable panels, and configurable persistence.

## Drop-in use

```tsx
import { TextSubmissionStudio } from "@/components/text-studio";

export default function MyComponent() {
  return <TextSubmissionStudio embedded />;
}
```

The module imports its own scoped CSS through its provider. It does not need a global theme provider, Tailwind utility classes, or database imports in the consuming component. The full-page version uses the same component without `embedded`.

See the live integration example at `/examples/embedded`.

## Receiving changes and submissions

Callback props must be supplied from a client component in Next.js.

```tsx
"use client";

import { useState } from "react";
import {
  TextSubmissionStudio,
  type SubmissionPayload,
  type SavedSubmission,
} from "@/components/text-studio";

export default function ArticleComposer() {
  const [draft, setDraft] = useState<SubmissionPayload | null>(null);

  function handleSubmit(submission: SavedSubmission) {
    console.log("Submission stored:", submission.id);
  }

  return (
    <section>
      <TextSubmissionStudio
        embedded
        defaultTheme="dark"
        initialSubmission={{
          title: "My submission",
          content: "Your words here.",
          author: "",
        }}
        onChange={setDraft}
        onSubmit={handleSubmit}
      />
      <p>{draft?.content.length ?? 0} characters</p>
    </section>
  );
}
```

`initialSubmission` is read on mount. Change the component's React `key` to initialize it with another piece. `onChange` includes the current text and animation settings; it does not save automatically. `onSave` fires after any successful draft/submission save, and `onSubmit` additionally fires for final submissions. `onChange` does not fire for UI theme changes or playhead scrubbing.

## Workspace theme

The header switch toggles light/dark appearance. The default is the operating-system theme, unless the browser has a saved preference. Preferences persist in localStorage and synchronize across tabs and instances using the same storage key. When browser storage is unavailable, theme switching still works for the current session.

- `defaultTheme`: `"light"`, `"dark"`, or `"system"` (default).
- `themeStorageKey`: storage namespace; defaults to `"letterform-theme"`. Give separate instances different keys for independent themes.
- `theme`: optional controlled `"light" | "dark"` value.
- `onThemeChange`: receives a new mode when the user toggles appearance.

```tsx
const [theme, setTheme] = useState<ColorMode>("dark");

<TextSubmissionStudio embedded theme={theme} onThemeChange={setTheme} />;
```

Import `ColorMode` from the module for the controlled example. A controlled instance needs `onThemeChange` to update its parent state. The workspace theme is not saved into the animation project and never changes the stage palette or exported video.

## Persistence integration

By default, the component calls the included PostgreSQL-backed `/api/submissions` routes. An alternative URL can be set with `apiEndpoint`. That service must provide:

- `GET endpoint`: `{ submissions: SavedSubmission[] }`
- `POST endpoint`: accepts `SubmissionPayload`, returns `{ submission: SavedSubmission }`
- `DELETE endpoint/:id`: returns `{ id: string }`

To use an existing service without matching those HTTP shapes, provide a stable, memoized `SubmissionAdapter`:

```tsx
const adapter = useMemo<SubmissionAdapter>(
  () => ({
    list: () => myService.listTexts(),
    save: (submission) => myService.saveText(submission),
    remove: (id) => myService.deleteText(id),
  }),
  [],
);

<TextSubmissionStudio embedded adapter={adapter} onSubmit={handleSubmit} />;
```

Import `SubmissionAdapter` from this module. An adapter overrides `apiEndpoint`. Server secrets should stay behind the consuming application's API routes.

## Compose your own layout

`TextStudioProvider` owns independent state and scoped styling. `useTextStudio` exposes the controller to any custom controls inside it. All panels share that provider; render `StudioOverlays` once for library/export dialogs and notifications.

```tsx
import {
  TextStudioProvider,
  StudioHeader,
  SubmissionPanel,
  PreviewPanel,
  TimelinePanel,
  InspectorPanel,
  StudioOverlays,
} from "@/components/text-studio";

<TextStudioProvider embedded defaultTheme="dark">
  <StudioHeader />
  <div className="workspace-shell">
    <div className="editor-grid">
      <SubmissionPanel />
      <section className="center-panel">
        <PreviewPanel />
        <TimelinePanel />
      </section>
      <InspectorPanel />
    </div>
  </div>
  <StudioOverlays />
</TextStudioProvider>;
```

`TextStudioWorkspace` is also exported for the default panel arrangement. Individual panels consume the provider; do not render them outside it. Generated input/dialog IDs are instance-specific. Shortcuts are scoped to the focused studio, leaving inputs, host controls, and other studios alone. Dialogs preserve focus and use themed portals so they are not clipped by host cards.

## Module layout

| File                                                      | Responsibility                                             |
| --------------------------------------------------------- | ---------------------------------------------------------- |
| `text-submission-studio.tsx`                              | Drop-in component and default workspace composition        |
| `studio-context.tsx`                                      | Provider, instance IDs, scoped keyboard controls           |
| `use-studio-controller.ts`                                | Editor state, animation actions, persistence orchestration |
| `use-studio-theme.ts`                                     | SSR-safe theme preference, system/browser subscriptions    |
| `submission-panel.tsx`                                    | Text editing and recent submissions                        |
| `preview-panel.tsx`, `stage-layer.tsx`                    | Composition preview and playback                           |
| `timeline-panel.tsx`                                      | Timeline tracks and keyframe controls                      |
| `inspector-panel.tsx`                                     | Motion, transforms, typography, stage palette              |
| `studio-modal.tsx`, `*-dialog.tsx`, `studio-overlays.tsx` | Accessible dialogs and notifications                       |
| `submission-service.ts`                                   | Default HTTP persistence adapter                           |
| `animation.ts`, `config.ts`, `format.ts`, `exports.ts`    | Shared animation/rendering utilities                       |
| `types.ts`                                                | Public integration types                                   |
| `studio.css`                                              | Scoped light/dark tokens and container-responsive styling  |

To transfer this studio into another project, copy the entire folder and use a relative import if that project has no `@` alias. Connect its persistence through `adapter` or equivalent API routes. The component requires React 18+ and uses no server-only imports. Pure animation utilities can also be imported directly from `animation.ts`.
