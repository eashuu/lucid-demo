import Logo from "./Logo";
import SearchBox from "./SearchBox";

const SUGGESTIONS = [
  "How does RAG reduce LLM hallucinations?",
  "Best free LLM APIs for students right now",
  "Explain React Server Components simply",
  "What happened in AI this week?",
];

export default function Hero({ onAsk }: { onAsk: (question: string) => void }) {
  return (
    <>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo size={44} />
            <p className="mt-3 text-muted">Ask anything. Get answers you can verify.</p>
          </div>

          <SearchBox onSubmit={onAsk} autoFocus large />

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onAsk(suggestion)}
                className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm text-muted transition hover:border-accent hover:text-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </main>
      <footer className="px-4 pb-6 text-center text-xs text-muted">
        Web search by Tavily · Answers by an open LLM on Groq · Built with Next.js
      </footer>
    </>
  );
}
