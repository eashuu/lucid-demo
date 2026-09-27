export default function Related({ questions, onAsk }: { questions: string[]; onAsk: (question: string) => void }) {
  return (
    <ul className="divide-y divide-border border-y border-border">
      {questions.map((question) => (
        <li key={question}>
          <button
            onClick={() => onAsk(question)}
            className="flex w-full items-center justify-between gap-4 py-3 text-left transition hover:text-accent"
          >
            <span>{question}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="shrink-0 text-accent">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
}
