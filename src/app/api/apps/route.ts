import { NextResponse } from "next/server";
import { apps, sessions } from "@/lib/db";
import { requireUserId, UnauthorizedError, unauthorizedResponse } from "@/lib/session";

/** Create an app for the current user, optionally linking + advancing a session. */
export async function POST(request: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return unauthorizedResponse();
    throw e;
  }

  const { name, slug, template, slot_map, snippets, output_type, sessionId } = await request.json();
  if (!name || !slug || !template) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const app = await apps.create(userId, {
    name,
    slug,
    template,
    slot_map: slot_map ?? {},
    snippets: snippets ?? [],
    output_type: output_type === "deploy" || output_type === "download" ? output_type : undefined,
  });

  if (sessionId) {
    await sessions.updateForUser(sessionId, userId, { app_id: app.id, stage: "assembling" });
  }

  return NextResponse.json({ app });
}
