import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { textSubmissions } from "@/db/schema";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "The submission ID is invalid." }, { status: 400 });
  }

  try {
    const [deleted] = await db
      .delete(textSubmissions)
      .where(eq(textSubmissions.id, id))
      .returning({ id: textSubmissions.id });

    if (!deleted) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }
    return NextResponse.json({ id: deleted.id });
  } catch (error) {
    console.error("Could not delete text submission:", error);
    return NextResponse.json({ error: "The submission could not be deleted." }, { status: 500 });
  }
}
