"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TextSubmissionStudio,
  type SubmissionPayload,
} from "@/components/text-studio";
import styles from "./page.module.css";

export default function EmbeddedStudioExample() {
  const [draft, setDraft] = useState<SubmissionPayload | null>(null);
  const [savedMessage, setSavedMessage] = useState(
    "Changes are available to the parent component as you write.",
  );
  const wordCount =
    draft?.content.trim().split(/\s+/).filter(Boolean).length ?? 0;

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <Link className={styles.back} href="/">
          ← Back to full studio
        </Link>
        <div className={styles.heading}>
          <div>
            <span className={styles.eyebrow}>
              COMPONENT INTEGRATION EXAMPLE
            </span>
            <h1>A studio, right where you need it.</h1>
            <p>
              This is a separate host page. The embedded editor owns its
              styling, theme, and controls.
            </p>
          </div>
          <span className={styles.badge}>EMBEDDED</span>
        </div>
        <TextSubmissionStudio
          embedded
          defaultTheme="dark"
          themeStorageKey="letterform-example-theme"
          initialSubmission={{
            title: "A note to keep",
            author: "A note from Maya",
          }}
          onChange={setDraft}
          onSave={(submission) =>
            setSavedMessage(`Saved “${submission.title}” to PostgreSQL.`)
          }
          onSubmit={(submission) =>
            setSavedMessage(
              `Submitted “${submission.title}”. The parent received ID ${submission.id}.`,
            )
          }
        />
        <section
          className={styles.summary}
          aria-label="Parent component state"
          aria-live="polite"
        >
          <div>
            <span className={styles.eyebrow}>PARENT COMPONENT STATE</span>
            <strong>{draft?.title || "Untitled submission"}</strong>
            <p>{savedMessage}</p>
          </div>
          <div className={styles.stats}>
            <span>
              <strong>{wordCount}</strong> words
            </span>
            <span>
              <strong>{draft?.settings.layers.length ?? 3}</strong> text layers
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
