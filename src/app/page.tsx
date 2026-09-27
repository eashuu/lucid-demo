"use client";

import { useEffect, useRef, useState } from "react";
import Hero from "@/components/Hero";
import Logo from "@/components/Logo";
import SearchBox from "@/components/SearchBox";
import TurnView from "@/components/TurnView";
import { readNdjson } from "@/lib/read-ndjson";
import type { HistoryTurn, StreamEvent, Turn } from "@/lib/types";

export default function Home() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const busy = turns.some((turn) => turn.status === "searching" || turn.status === "answering");
  const lastId = turns.at(-1)?.id;

  // Bring each new question into view.
  useEffect(() => {
    if (lastId) document.getElementById(`turn-${lastId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [lastId]);

  async function ask(question: string) {
    if (busy) return;

    const id = `${Date.now()}`;
    // The last two finished answers give the model context for follow-up questions.
    const history: HistoryTurn[] = turns
      .filter((turn) => turn.status === "done" && turn.answer)
      .slice(-2)
      .map((turn) => ({ question: turn.question, answer: turn.answer }));
    const update = (patch: (turn: Turn) => Partial<Turn>) =>
      setTurns((all) => all.map((turn) => (turn.id === id ? { ...turn, ...patch(turn) } : turn)));

    setTurns((all) => [...all, { id, question, sources: [], answer: "", related: [], status: "searching" }]);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: question, history }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }

      for await (const event of readNdjson<StreamEvent>(res.body)) {
        if (event.type === "sources") update(() => ({ sources: event.sources, status: "answering" }));
        else if (event.type === "token") update((turn) => ({ answer: turn.answer + event.text }));
        else if (event.type === "related") update(() => ({ related: event.questions }));
        else if (event.type === "error") update(() => ({ status: "error", error: event.message }));
        else if (event.type === "done") update(() => ({ status: "done" }));
      }

      // The stream ended without a "done" or "error" event (for example, a server timeout).
      update((turn) =>
        turn.status === "searching" || turn.status === "answering"
          ? { status: "error", error: "The connection closed before the answer finished. Try again." }
          : {},
      );
    } catch (error) {
      if (controller.signal.aborted) {
        update((turn) => (turn.answer ? { status: "done" } : { status: "error", error: "Stopped." }));
      } else {
        update(() => ({ status: "error", error: error instanceof Error ? error.message : "Something went wrong." }));
      }
    } finally {
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  function newSearch() {
    stop();
    setTurns([]);
  }

  if (turns.length === 0) return <Hero onAsk={ask} />;

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={newSearch} aria-label="Home">
            <Logo size={24} />
          </button>
          <button
            onClick={newSearch}
            className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm transition hover:border-accent"
          >
            New search
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-10 px-4 pt-8 pb-10">
        {turns.map((turn, index) => (
          <div key={turn.id} className="border-t border-border pt-10 first:border-t-0 first:pt-0">
            <TurnView turn={turn} showRelated={index === turns.length - 1 && !busy} onAsk={ask} />
          </div>
        ))}
      </main>

      <div className="sticky bottom-0 bg-linear-to-t from-background via-background to-transparent pt-6 pb-4">
        <div className="mx-auto max-w-3xl px-4">
          <SearchBox onSubmit={ask} busy={busy} onStop={stop} placeholder="Ask a follow-up…" />
        </div>
      </div>
    </div>
  );
}
