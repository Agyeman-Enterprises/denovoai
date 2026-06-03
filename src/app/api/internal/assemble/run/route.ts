/**
 * POST /api/internal/assemble/run
 *
 * Internal endpoint invoked by the ae-queue worker (HTTP-callback handler) to
 * run an assembly job durably. Authenticated by an HMAC-SHA256 signature of the
 * raw body using AE_QUEUE_CALLBACK_SECRET (shared with the ae-queue worker).
 *
 * NOT a user-facing route — it carries no session. The middleware lets
 * /api/internal through; this signature check is its only gate. A 2xx tells
 * ae-queue the job is done; a 5xx makes it retry with backoff.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import { runAssembly } from "@/lib/assembler";
import type { SlotMap } from "@/types/denovo";

export const dynamic = "force-dynamic";

function validSignature(raw: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(header, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const raw = await request.text();

  const secret = process.env.AE_QUEUE_CALLBACK_SECRET;
  if (!secret) {
    // Misconfiguration — fail closed rather than run unauthenticated work.
    return new Response(JSON.stringify({ error: "callback secret not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!validSignature(raw, request.headers.get("x-ae-queue-signature"), secret)) {
    return new Response(JSON.stringify({ error: "invalid signature" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: { jobId?: string; appId?: string; slotMap?: unknown; outputType?: string };
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), { status: 400 });
  }

  const { jobId, appId, slotMap, outputType } = payload;
  if (!jobId || !appId || !slotMap || (outputType !== "deploy" && outputType !== "download")) {
    return new Response(JSON.stringify({ error: "missing or invalid fields" }), { status: 400 });
  }

  try {
    await runAssembly(jobId, appId, slotMap as SlotMap, outputType);
  } catch (e) {
    // Non-2xx so ae-queue retries with backoff.
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "assembly failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
