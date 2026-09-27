import type { ReactNode } from "react";
import type { Turn } from "@/lib/types";
import Answer from "./Answer";
import Related from "./Related";
import Sources from "./Sources";

function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-muted uppercase">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {icon}
      </svg>
      {children}
    </h2>
  );
}

type Props = {
  turn: Turn;
  showRelated: boolean;
  onAsk: (question: string) => void;
};

export default function TurnView({ turn, showRelated, onAsk }: Props) {
  const searching = turn.status === "searching";
  const answering = turn.status === "answering";

  return (
    <article id={`turn-${turn.id}`} className="scroll-mt-20 space-y-7">
      <h1 className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">{turn.question}</h1>

      {(searching || turn.sources.length > 0) && (
        <section>
          <SectionTitle icon={<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />}>
            Sources
          </SectionTitle>
          <Sources sources={turn.sources} loading={searching} />
        </section>
      )}

      {(answering || turn.answer) && (
        <section>
          <SectionTitle icon={<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z" />}>Answer</SectionTitle>
          <Answer text={turn.answer} sources={turn.sources} streaming={answering} />
        </section>
      )}

      {turn.status === "error" && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {turn.error}
        </p>
      )}

      {showRelated && turn.related.length > 0 && (
        <section>
          <SectionTitle icon={<path d="M4 6h16M4 12h16M4 18h10" />}>Related</SectionTitle>
          <Related questions={turn.related} onAsk={onAsk} />
        </section>
      )}
    </article>
  );
}
