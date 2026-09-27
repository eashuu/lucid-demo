import { suggestRelated, toStandaloneQuery } from "@/lib/followups";
import { streamChat, type ChatMessage } from "@/lib/llm";
import { answerSystemPrompt } from "@/lib/prompts";
import { searchWeb } from "@/lib/search";
import type { HistoryTurn, StreamEvent } from "@/lib/types";

// Search + streaming can take a while; allow up to 60 s on Vercel.
export const maxDuration = 60;

const MAX_QUERY_LENGTH = 500;
const MAX_HISTORY_TURNS = 2;

type AskRequest = { query: string; history: HistoryTurn[] };

function readAskRequest(body: unknown): AskRequest | null {
  if (typeof body !== "object" || body === null) return null;
  const { query, history } = body as { query?: unknown; history?: unknown };
  if (typeof query !== "string") return null;

  const trimmed = query.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_QUERY_LENGTH) return null;

  // History is optional; keep only well-formed turns, trimmed to a sane size.
  const turns = Array.isArray(history) ? history : [];
  const validTurns = turns
    .filter(
      (turn): turn is HistoryTurn =>
        typeof turn === "object" &&
        turn !== null &&
        typeof (turn as HistoryTurn).question === "string" &&
        typeof (turn as HistoryTurn).answer === "string",
    )
    .slice(-MAX_HISTORY_TURNS)
    .map((turn) => ({ question: turn.question.slice(0, MAX_QUERY_LENGTH), answer: turn.answer.slice(0, 2000) }));

  return { query: trimmed, history: validTurns };
}

/** Earlier answers go back to the model without their old [n] markers, which point at old sources. */
function historyMessages(history: HistoryTurn[]): ChatMessage[] {
  return history.flatMap((turn): ChatMessage[] => [
    { role: "user", content: turn.question },
    { role: "assistant", content: turn.answer.replace(/\[\d+(?:\s*,\s*\d+)*\]/g, "") },
  ]);
}

// POST /api/ask  { "query": "...", "history"?: [{ "question", "answer" }] }  →  NDJSON stream
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const ask = readAskRequest(body);
  if (!ask) {
    return Response.json(
      { error: `Send JSON like {"query": "..."} (1-${MAX_QUERY_LENGTH} characters).` },
      { status: 400 },
    );
  }
  const { query, history } = ask;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        } catch {
          // The browser closed the connection; nothing left to send to.
        }
      };

      try {
        // 1. Retrieve (follow-ups are rewritten into a full question first)
        const searchQuery = await toStandaloneQuery(query, history);
        const sources = await searchWeb(searchQuery);
        if (sources.length === 0) throw new Error("No web results found. Try rephrasing your question.");
        send({ type: "sources", sources });

        // Related questions only need the titles, so start them now, alongside the answer.
        const related = suggestRelated(searchQuery, sources).catch(() => []);

        // 2. Augment
        const messages: ChatMessage[] = [
          { role: "system", content: answerSystemPrompt(sources) },
          ...historyMessages(history),
          { role: "user", content: query },
        ];

        // 3. Generate, forwarding each chunk as it arrives
        for await (const text of streamChat(messages, request.signal)) {
          send({ type: "token", text });
        }

        send({ type: "related", questions: await related });
        send({ type: "done" });
      } catch (error) {
        send({ type: "error", message: error instanceof Error ? error.message : "Something went wrong." });
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
