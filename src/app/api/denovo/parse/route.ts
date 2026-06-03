import { NextResponse } from "next/server";
import { callLiteLLM } from "@/lib/litellm";
import { sessions } from "@/lib/db";
import { requireUserId, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import type { ChatMessage } from "@/types/denovo";
import type { SessionStage } from "@/types/db";

const SYSTEM_PROMPT = `You are DeNovo's Intent Parser. Your job is to understand what app a user wants to build and extract the information needed to generate it from a template.

RULES:
- Ask ONE question at a time, never multiple
- Be conversational, not form-like
- Make smart assumptions and state them clearly
- Maximum 3 clarifying questions before confirming
- If the user's description is already detailed, skip straight to confirmation
- When you have enough info, set stage to "confirming" and show a summary

TEMPLATES AVAILABLE: marketplace, saas, directory, community, ecommerce, client-portal, internal-tool, content-media

SLOT MAP TO FILL:
{
  "APP_NAME": string (short, memorable, 1-2 words),
  "TAGLINE": string (one-line pitch),
  "HERO_COPY": string (landing page headline),
  "TEMPLATE": one of the templates above,
  "SELLER_NOUN": string (marketplace only),
  "BUYER_NOUN": string (marketplace only),
  "LISTING_NOUN": string (marketplace only),
  "CATEGORIES": string[] (4-6 items),
  "PLATFORM_FEE_PERCENT": number (marketplace only, default 10),
  "PRIMARY_COLOR": string (hex color matching the app's vibe),
  "SCHEMA_EXTRAS": string[] (extra database fields inferred from description),
  "SNIPPETS": string[] (modules to include)
}

SNIPPET AUTO-SELECTION based on description:
- Always include: auth, admin-panel
- Marketplace: always add stripe-connect
- Other templates: add stripe-simple if monetization mentioned
- Add reviews if: rating/review/feedback mentioned
- Add messaging if: chat/contact/communicate mentioned
- Add bookings if: schedule/calendar/appointment/book mentioned
- Add file-upload if: photo/portfolio/upload/file mentioned
- Add search-filter if: search/filter/browse mentioned
- Add notifications if: notify/alert/email/remind mentioned

Respond ONLY in valid JSON:
{
  "message": "Your conversational reply to show the user",
  "slots": { ...any newly extracted or updated slots },
  "stage": "clarifying" | "confirming" | "ready"
}

When stage is "confirming", your message should be a clean summary like:
"Here's what I'll build:

  Name: AppName
  Type: Template Type
  ...all relevant slots...

  AI-detected extras:
  + field1
  + field2

  Looks right? Or want to change anything?"`;

export async function POST(request: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return unauthorizedResponse();
    throw e;
  }

  const { sessionId, message } = await request.json();

  if (!sessionId || !message) {
    return NextResponse.json({ error: "Missing sessionId or message" }, { status: 400 });
  }

  // Get or create session (scoped to this user)
  let session = await sessions.getForUser(sessionId, userId);
  if (!session) {
    session = await sessions.create(userId, sessionId);
  }

  // Build conversation history
  const messages = (session.messages as ChatMessage[]) || [];
  messages.push({ role: "user", content: message, timestamp: new Date().toISOString() });

  const currentSlots = (session.slot_map as Record<string, unknown>) || {};

  // Call LiteLLM — Tier 5 (sonnet) for agentic slot extraction
  const assistantText = await callLiteLLM({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Current conversation:\n${messages.map((m: ChatMessage) => `${m.role}: ${m.content}`).join("\n")}\n\nCurrent slots: ${JSON.stringify(currentSlots)}\n\nRespond in JSON only.`,
      },
    ],
  });

  let parsed: { message: string; slots?: Record<string, unknown>; stage: string };
  try {
    parsed = JSON.parse(assistantText);
  } catch {
    parsed = { message: assistantText, stage: "clarifying" };
  }

  // Merge slots
  const mergedSlots = { ...currentSlots, ...(parsed.slots || {}) };

  // Add assistant message to history
  messages.push({ role: "assistant", content: parsed.message, timestamp: new Date().toISOString() });

  // Determine session stage
  const sessionStage: SessionStage = parsed.stage === "ready" ? "assembling" : parsed.stage === "confirming" ? "confirming" : "clarifying";

  // Update session (scoped to this user)
  await sessions.updateForUser(sessionId, userId, {
    messages,
    slot_map: mergedSlots,
    stage: sessionStage,
  });

  return NextResponse.json({
    message: parsed.message,
    stage: parsed.stage,
    slots: mergedSlots,
  });
}
