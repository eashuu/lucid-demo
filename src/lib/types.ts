export type Source = {
  id: number;
  title: string;
  url: string;
  snippet: string;
};

/** A finished question/answer pair, sent back to the server for follow-up questions. */
export type HistoryTurn = {
  question: string;
  answer: string;
};

/** One question and everything the UI shows for it. */
export type Turn = {
  id: string;
  question: string;
  sources: Source[];
  answer: string;
  related: string[];
  status: "searching" | "answering" | "done" | "error";
  error?: string;
};

/** One line of the NDJSON stream returned by POST /api/ask. */
export type StreamEvent =
  | { type: "sources"; sources: Source[] }
  | { type: "token"; text: string }
  | { type: "related"; questions: string[] }
  | { type: "error"; message: string }
  | { type: "done" };
