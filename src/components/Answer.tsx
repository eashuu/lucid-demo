import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Source } from "@/lib/types";

/** Turns "[1]" and "[1, 2]" into markdown links "[1](#cite-1)" so we can render them as chips. */
function linkCitations(markdown: string): string {
  return markdown.replace(/\[(\d+(?:\s*,\s*\d+)*)\](?!\()/g, (_match, numbers: string) =>
    numbers
      .split(/\s*,\s*/)
      .map((n) => `[${n}](#cite-${n})`)
      .join(""),
  );
}

export default function Answer({ text, sources, streaming }: { text: string; sources: Source[]; streaming: boolean }) {
  if (!text && streaming) {
    return (
      <div className="space-y-2.5" aria-label="Writing answer">
        <div className="h-3.5 w-full animate-pulse rounded bg-border/70" />
        <div className="h-3.5 w-11/12 animate-pulse rounded bg-border/70" />
        <div className="h-3.5 w-4/6 animate-pulse rounded bg-border/70" />
      </div>
    );
  }

  return (
    <div className="answer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const citation = href?.match(/^#cite-(\d+)$/);
            if (citation) {
              const source = sources.find((s) => s.id === Number(citation[1]));
              if (!source) return null; // the model cited a source that doesn't exist: hide it
              return (
                <a className="cite" href={source.url} target="_blank" rel="noreferrer" title={source.title}>
                  {source.id}
                </a>
              );
            }
            return (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {linkCitations(text)}
      </ReactMarkdown>
      {streaming && <span className="ml-0.5 inline-block size-2 animate-pulse rounded-full bg-accent align-middle" />}
    </div>
  );
}
