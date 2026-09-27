import { demoRelated } from "./demo";
import { completeChat, hasLlmKey } from "./llm";
import { relatedQuestionsPrompt, standaloneQueryPrompt } from "./prompts";
import type { HistoryTurn, Source } from "./types";

/** Strips list markers, quotes and bold markers the model may add despite instructions. */
function cleanLine(line: string): string {
  return line
    .replace(/^\s*(?:(?:[-*•]|\d+[.)])\s*)+/, "")
    .replace(/\*\*/g, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

export async function suggestRelated(query: string, sources: Source[]): Promise<string[]> {
  if (!hasLlmKey()) return demoRelated();

  const text = await completeChat([
    { role: "system", content: relatedQuestionsPrompt(sources) },
    { role: "user", content: query },
  ]);
  return text
    .split("\n")
    .map(cleanLine)
    .filter((line) => line.length > 5)
    .slice(0, 3);
}

/**
 * Search engines need the full question: "what about its price?" finds nothing useful.
 * With earlier turns in the conversation, ask the LLM to rewrite the query first.
 */
export async function toStandaloneQuery(query: string, history: HistoryTurn[]): Promise<string> {
  if (history.length === 0 || !hasLlmKey()) return query;

  const conversation = history
    .map((turn) => `User: ${turn.question}\nAssistant: ${turn.answer.slice(0, 500)}`)
    .join("\n\n");
  const rewritten = cleanLine(
    await completeChat([
      { role: "system", content: standaloneQueryPrompt() },
      { role: "user", content: `${conversation}\n\nLatest message: ${query}` },
    ]),
  );
  return rewritten && rewritten.length <= 300 ? rewritten : query;
}
