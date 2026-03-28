import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// AI generation — uses Anthropic Claude API when ANTHROPIC_API_KEY is set.
// Gracefully stubs when no key present (won't crash build or runtime).

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId, prompt } = await request.json();

  const { data: item } = await supabase.from("items").select("*").eq("id", itemId).eq("user_id", user.id).single();
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  let output: Record<string, unknown>;

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          messages: [{
            role: "user",
            content: prompt || `Generate a {{PRIMARY_ENTITY}} based on: ${item.title}. Input: ${JSON.stringify(item.input_data)}`,
          }],
        }),
      });

      if (!res.ok) {
        output = { generated: false, error: `AI API error: ${res.status}`, timestamp: new Date().toISOString() };
      } else {
        const data = await res.json();
        output = {
          generated: true,
          content: data.content?.[0]?.text || "No output.",
          model: "claude-sonnet-4-20250514",
          tokens_used: data.usage?.output_tokens || 0,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (err) {
      output = { generated: false, error: err instanceof Error ? err.message : "Unknown", timestamp: new Date().toISOString() };
    }
  } else {
    // Stub — no API key
    output = {
      generated: true,
      stub: true,
      content: `[STUB] Generated {{PRIMARY_ENTITY}} for "${item.title}". Set ANTHROPIC_API_KEY for real AI output.`,
      timestamp: new Date().toISOString(),
    };
  }

  await supabase.from("items").update({
    output_data: output,
    status: output.generated ? "active" : "draft",
    updated_at: new Date().toISOString(),
  }).eq("id", itemId);

  return NextResponse.json({ output });
}
