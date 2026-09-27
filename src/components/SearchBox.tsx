"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";

type Props = {
  onSubmit: (question: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  busy?: boolean;
  onStop?: () => void;
  large?: boolean;
};

export default function SearchBox({ onSubmit, placeholder = "Ask anything…", autoFocus, busy, onStop, large }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const question = value.trim();
    if (!question || busy) return;
    onSubmit(question);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter adds a new line.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  function autoGrow(element: HTMLTextAreaElement) {
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 200)}px`;
  }

  return (
    <form
      onSubmit={submit}
      className={`flex items-end gap-2 rounded-2xl border border-border bg-surface p-2 shadow-sm transition focus-within:border-accent ${
        large ? "pl-4" : "pl-3"
      }`}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          autoGrow(event.target);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={1}
        maxLength={500}
        aria-label="Your question"
        className={`flex-1 resize-none bg-transparent outline-none placeholder:text-muted ${
          large ? "min-h-[3.5rem] py-3 text-lg" : "py-2 text-base"
        }`}
      />
      {busy && onStop ? (
        <button
          type="button"
          onClick={onStop}
          aria-label="Stop answering"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-foreground text-background transition hover:opacity-80"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <rect width="14" height="14" rx="2" fill="currentColor" />
          </svg>
        </button>
      ) : (
        <button
          type="submit"
          disabled={!value.trim() || busy}
          aria-label="Ask"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      )}
    </form>
  );
}
