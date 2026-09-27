import { demoSources } from "./demo";
import type { Source } from "./types";

type TavilyResult = {
  title: string;
  url: string;
  content: string;
  score: number;
};

type TavilyResponse = {
  results: TavilyResult[];
};

/**
 * Searches the web with Tavily and returns numbered sources for the LLM prompt.
 * 5 results x 800 chars keeps the prompt near 1,500 tokens (Groq free tier: 8K tokens/min).
 */
export async function searchWeb(query: string, maxResults = 5): Promise<Source[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return demoSources();

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      max_results: maxResults,
      search_depth: "basic",
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 200);
    throw new Error(`Web search failed (${res.status}): ${detail}`);
  }

  const data = (await res.json()) as TavilyResponse;
  return data.results.map((result, index) => ({
    id: index + 1,
    title: result.title,
    url: result.url,
    snippet: result.content.slice(0, 800),
  }));
}
