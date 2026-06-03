/**
 * ae-queue client — durable offload for the assembly pipeline.
 *
 * The assembly job is enqueued on ae-queue (durable tier). The ae-queue worker
 * delivers it back to this app's internal endpoint (/api/internal/assemble/run)
 * via an authenticated HTTP callback, where runAssembly() actually executes.
 * ae-queue owns durability, retry and backoff; the work stays in this app.
 *
 * If ae-queue isn't configured (local dev), enqueueAssembly() returns null and
 * the caller falls back to running the pipeline inline.
 */
import { Buffer } from "node:buffer";

export interface AssemblyJobPayload {
  jobId: string;
  appId: string;
  slotMap: unknown;
  outputType: "deploy" | "download";
}

/**
 * Enqueue an assembly job on ae-queue. Returns the queue job id, or null if
 * ae-queue is not configured (AE_QUEUE_URL / AE_INTERNAL_URL unset).
 */
export async function enqueueAssembly(payload: AssemblyJobPayload): Promise<string | null> {
  const base = process.env.AE_QUEUE_URL;
  const internalBase = process.env.AE_INTERNAL_URL; // internal address of THIS app
  if (!base || !internalBase) return null;

  // Go's []byte unmarshals from a base64 JSON string; the worker POSTs these
  // raw bytes (our JSON) to the callback endpoint.
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");

  const res = await fetch(`${base.replace(/\/$/, "")}/enqueue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      Queue: process.env.AE_QUEUE_NAME ?? "ae-design-studio",
      Name: "assemble",
      Tier: "durable",
      Payload: payloadB64,
      MaxRetries: 3,
      Metadata: {
        callback_url: `${internalBase.replace(/\/$/, "")}/api/internal/assemble/run`,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ae-queue enqueue failed (${res.status}): ${detail}`);
  }
  const result = (await res.json()) as { ID?: string };
  return result.ID ?? null;
}
