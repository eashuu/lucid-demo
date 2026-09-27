import { demoAnswerStream } from "./demo";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatChunk = {
  choices?: { delta?: { content?: string | null } }[];
  error?: { message?: string };
};

type ChatCompletion = {
  choices?: { message?: { content?: string | null } }[];
};

function llmConfig() {
  const model = process.env.LLM_MODEL || "openai/gpt-oss-120b";
  return {
    baseUrl: (process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/+$/, ""),
    apiKey: process.env.LLM_API_KEY,
    model,
    // A smaller model for quick helper calls; on Groq it also has its own rate-limit bucket.
    fastModel: process.env.LLM_FAST_MODEL || model,
    // Only for reasoning models (gpt-oss on Groq): "low" keeps answers fast and cheap on tokens.
    reasoningEffort: process.env.LLM_REASONING_EFFORT,
  };
}

export function hasLlmKey(): boolean {
  return Boolean(process.env.LLM_API_KEY);
}

async function postChatCompletion(body: object, signal?: AbortSignal): Promise<Response> {
  const { baseUrl, apiKey } = llmConfig();
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    if (res.status === 429) {
      throw new Error(`The AI provider's rate limit was hit. Wait a minute and try again. (${detail})`);
    }
    throw new Error(`LLM request failed (${res.status}): ${detail}`);
  }
  return res;
}

/**
 * Streams answer text from any OpenAI-compatible /chat/completions endpoint
 * (Groq, Gemini, OpenRouter, Ollama...). Falls back to a demo answer without a key.
 */
export async function* streamChat(messages: ChatMessage[], signal?: AbortSignal): AsyncGenerator<string> {
  const { apiKey, model, reasoningEffort } = llmConfig();
  if (!apiKey) {
    yield* demoAnswerStream();
    return;
  }

  const res = await postChatCompletion(
    { model, messages, stream: true, temperature: 0.2, ...(reasoningEffort && { reasoning_effort: reasoningEffort }) },
    signal,
  );
  if (!res.body) throw new Error("The LLM returned an empty response.");

  // The body is Server-Sent Events: lines of `data: {json}`, ending with `data: [DONE]`.
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) return;

      buffer += value;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // keep a half-received line for the next chunk

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith("data:")) continue;

        const data = line.slice("data:".length).trim();
        if (data === "[DONE]") return;

        const chunk = JSON.parse(data) as ChatChunk;
        if (chunk.error) throw new Error(chunk.error.message ?? "The LLM stream failed.");

        const text = chunk.choices?.[0]?.delta?.content;
        if (text) yield text;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/** One-shot (non-streaming) completion on the fast model, for small helper tasks. */
export async function completeChat(messages: ChatMessage[], signal?: AbortSignal): Promise<string> {
  const { fastModel, reasoningEffort } = llmConfig();
  const res = await postChatCompletion(
    { model: fastModel, messages, temperature: 0.3, ...(reasoningEffort && { reasoning_effort: reasoningEffort }) },
    signal,
  );
  const data = (await res.json()) as ChatCompletion;
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}
