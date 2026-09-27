import type { Source } from "@/lib/types";

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function Sources({ sources, loading }: { sources: Source[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex gap-2 overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[4.75rem] w-44 shrink-0 animate-pulse rounded-xl bg-border/60" />
        ))}
      </div>
    );
  }

  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {sources.map((source) => {
        const host = hostname(source.url);
        return (
          <a
            key={source.id}
            id={`source-${source.id}`}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            title={source.title}
            className="flex w-44 shrink-0 snap-start flex-col justify-between gap-2 rounded-xl border border-border bg-surface p-3 transition hover:border-accent"
          >
            <span className="line-clamp-2 text-[0.8rem] leading-snug font-medium">{source.title}</span>
            <span className="flex items-center gap-1.5 text-xs text-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- tiny third-party favicon */}
              <img
                src={`https://www.google.com/s2/favicons?domain=${host}&sz=32`}
                alt=""
                width={14}
                height={14}
                className="rounded-sm"
              />
              <span className="truncate">{host}</span>
              <span className="ml-auto font-medium">{source.id}</span>
            </span>
          </a>
        );
      })}
    </div>
  );
}
