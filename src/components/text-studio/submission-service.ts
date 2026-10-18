import type {
  SavedSubmission,
  SubmissionAdapter,
  SubmissionPayload,
} from "./types";

async function readResponse<T>(response: Response): Promise<T> {
  let payload: T & { error?: string };
  try {
    payload = (await response.json()) as T & { error?: string };
  } catch {
    throw new Error("The submission service returned an invalid response.");
  }
  if (!response.ok)
    throw new Error(payload.error || "The submission service is unavailable.");
  return payload;
}

/** Default persistence adapter. No database or server-only imports enter the component bundle. */
export function createHttpSubmissionAdapter(
  endpoint = "/api/submissions",
): SubmissionAdapter {
  const base = endpoint.replace(/\/$/, "");
  return {
    async list() {
      const response = await fetch(base, { cache: "no-store" });
      const payload = await readResponse<{ submissions?: SavedSubmission[] }>(
        response,
      );
      return Array.isArray(payload.submissions) ? payload.submissions : [];
    },
    async save(submission: SubmissionPayload) {
      const response = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      });
      const payload = await readResponse<{ submission?: SavedSubmission }>(
        response,
      );
      if (!payload.submission) throw new Error("Your text could not be saved.");
      return payload.submission;
    },
    async remove(id: string) {
      const response = await fetch(`${base}/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      await readResponse<{ id: string }>(response);
    },
  };
}
