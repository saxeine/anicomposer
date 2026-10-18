import { randomUUID } from "node:crypto";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { textSubmissions } from "@/db/schema";

export const runtime = "nodejs";

const allowedPresets = new Set([
  "fade-up",
  "typewriter",
  "word-by-word",
  "float",
  "pop",
]);

export async function GET() {
  try {
    const submissions = await db
      .select()
      .from(textSubmissions)
      .orderBy(desc(textSubmissions.updatedAt))
      .limit(50);

    return NextResponse.json({ submissions }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load text submissions:", error);
    return NextResponse.json({ error: "Submissions could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;

  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Send a valid JSON submission." }, { status: 400 });
  }

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const content = typeof payload.content === "string" ? payload.content.trim() : "";
  const author = typeof payload.author === "string" ? payload.author.trim() : "";
  const status = payload.status === "submitted" ? "submitted" : "draft";
  const preset = typeof payload.preset === "string" && allowedPresets.has(payload.preset)
    ? payload.preset
    : "fade-up";
  const incomingId = typeof payload.id === "string" ? payload.id : undefined;

  if (!title || title.length > 120) {
    return NextResponse.json({ error: "Add a title of 1–120 characters." }, { status: 400 });
  }
  if (!content || content.length > 5000) {
    return NextResponse.json({ error: "Text must be between 1 and 5,000 characters." }, { status: 400 });
  }
  if (author.length > 80) {
    return NextResponse.json({ error: "The byline must be 80 characters or fewer." }, { status: 400 });
  }
  if (incomingId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(incomingId)) {
    return NextResponse.json({ error: "The submission ID is invalid." }, { status: 400 });
  }

  const settings = payload.settings && typeof payload.settings === "object" && !Array.isArray(payload.settings)
    ? payload.settings as Record<string, unknown>
    : {};

  try {
    if (JSON.stringify(settings).length > 100_000) {
      return NextResponse.json({ error: "Animation settings are too large." }, { status: 413 });
    }

    const [submission] = await db
      .insert(textSubmissions)
      .values({
        id: incomingId ?? randomUUID(),
        title,
        content,
        author,
        status,
        preset,
        settings,
      })
      .onConflictDoUpdate({
        target: textSubmissions.id,
        set: {
          title,
          content,
          author,
          status,
          preset,
          settings,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("Could not save text submission:", error);
    return NextResponse.json({ error: "Your submission could not be saved." }, { status: 500 });
  }
}
