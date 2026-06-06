// AE Cardinal Inference Stack — all AI calls route through LiteLLM
// Base URL: https://ai.agyemanenterprises.com
// Never call provider SDKs directly — doctrine violation

const LITELLM_BASE_URL =
  process.env.LITELLM_BASE_URL ?? "https://ai.agyemanenterprises.com";
const LITELLM_API_KEY = process.env.LITELLM_API_KEY!;

export interface LiteLLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LiteLLMOptions {
  model: string;
  messages: LiteLLMMessage[];
  max_tokens?: number;
  temperature?: number;
  response_format?: { type: "json_object" };
}

export interface LiteLLMResponse {
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export async function callLiteLLM(opts: LiteLLMOptions): Promise<string> {
  const res = await fetch(`${LITELLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LITELLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      max_tokens: opts.max_tokens ?? 1024,
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
      ...(opts.response_format ? { response_format: opts.response_format } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LiteLLM error ${res.status}: ${err}`);
  }

  const data: LiteLLMResponse = await res.json();
  return data.choices[0]?.message?.content ?? "";
}
