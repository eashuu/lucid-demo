import type { Source } from "./types";

// Demo mode: used when API keys are missing, so the app still runs
// (offline classroom, key signup failed, or you're building the UI first).

export function demoSources(): Source[] {
  return [
    {
      id: 1,
      title: "Demo · Retrieval-augmented generation — Wikipedia",
      url: "https://en.wikipedia.org/wiki/Retrieval-augmented_generation",
      snippet:
        "Retrieval-augmented generation (RAG) is a technique that lets large language models retrieve and use new information before responding to a query.",
    },
    {
      id: 2,
      title: "Demo · Tavily Search API documentation",
      url: "https://docs.tavily.com",
      snippet:
        "Tavily is a search engine built for AI agents. It returns clean, relevant content snippets ready to be passed to an LLM.",
    },
    {
      id: 3,
      title: "Demo · Groq API — OpenAI compatibility",
      url: "https://console.groq.com/docs/openai",
      snippet:
        "Groq's API is compatible with the OpenAI client libraries: change the base URL and API key, and existing code works.",
    },
    {
      id: 4,
      title: "Demo · Next.js Route Handlers",
      url: "https://nextjs.org/docs/app/getting-started/route-handlers",
      snippet:
        "Route Handlers let you create custom request handlers using the Web Request and Response APIs, including streaming responses.",
    },
  ];
}

const DEMO_ANSWER = `> **Demo mode** — no API keys found. Add them to \`.env.local\` and restart \`npm run dev\` to get real answers.

**Lucid is a retrieval-augmented generation (RAG) app.** Instead of answering from memory, it first *retrieves* fresh information from the web and then asks an LLM to *generate* an answer grounded in those results [1].

How one question flows through the app:

1. **Search** — the server sends your question to the Tavily search API, which returns clean text snippets from the top pages [2].
2. **Augment** — those snippets are numbered and pasted into the LLM's prompt as context.
3. **Generate** — an OpenAI-compatible model such as gpt-oss on Groq streams the answer back token by token [3].
4. **Stream** — a Next.js route handler forwards each token to your browser as it arrives [4].

Because every sentence carries a citation like [1], you can click through and verify the claim yourself.`;

export async function* demoAnswerStream(): AsyncGenerator<string> {
  const words = DEMO_ANSWER.split(/(?<=\s)/);
  for (const word of words) {
    await new Promise((resolve) => setTimeout(resolve, 18));
    yield word;
  }
}

export function demoRelated(): string[] {
  return [
    "How is RAG different from fine-tuning an LLM?",
    "What is a vector database and when do I need one?",
    "How do I stop an LLM from hallucinating sources?",
  ];
}
