import type { NextRequest } from "next/server";
import { searchWeb } from "@/lib/search";

// GET /api/search?q=your+question — web search only. Handy for testing in the browser.
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return Response.json({ error: "Add a question: /api/search?q=..." }, { status: 400 });
  }
  if (query.length > 500) {
    return Response.json({ error: "Question is too long (max 500 characters)." }, { status: 400 });
  }

  try {
    const sources = await searchWeb(query);
    return Response.json({ query, sources });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
