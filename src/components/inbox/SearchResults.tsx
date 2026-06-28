import { Fragment } from "react";

import { createClient } from "@/utils/supabase/server";

import { cn } from "@/lib/utils";
import { relativeTime } from "@/utils/relativeTime";

const PAGE_SIZE = 20;

interface SearchResultRow {
  id: string;
  subject: string | null;
  body_text: string | null;
  received_at: string;
  sender_id: string;
  is_read: boolean | null;
  senders: { display_name: string | null; email_address: string } | null;
}

function getSnippet(bodyText: string | null, q: string): string {
  if (!bodyText) return "";

  const text = bodyText
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";

  const words = q.split(/\s+/).filter(Boolean);
  const lowerText = text.toLowerCase();

  let matchIdx = -1;
  for (const word of words) {
    const idx = lowerText.indexOf(word.toLowerCase());
    if (idx !== -1 && (matchIdx === -1 || idx < matchIdx)) {
      matchIdx = idx;
    }
  }

  if (matchIdx === -1) {
    const snippet = text.slice(0, 120);
    return snippet.length < text.length ? snippet + "..." : snippet;
  }

  const windowSize = 120;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(0, matchIdx - half);
  const end = Math.min(text.length, start + windowSize);
  if (end - start < windowSize) {
    start = Math.max(0, end - windowSize);
  }

  let snippet = text.slice(start, end);

  if (start > 0) {
    const firstSpace = snippet.indexOf(" ");
    if (firstSpace !== -1 && firstSpace < snippet.length - 1) {
      snippet = snippet.slice(firstSpace + 1);
    }
  }
  if (end < text.length) {
    const lastSpace = snippet.lastIndexOf(" ");
    if (lastSpace > 0) {
      snippet = snippet.slice(0, lastSpace);
    }
  }

  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";
  return prefix + snippet.trim() + suffix;
}

function HighlightedSnippet({ snippet, q }: { snippet: string; q: string }) {
  const words = q
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
  if (words.length === 0 || !snippet) {
    return <>{snippet}</>;
  }
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = snippet.split(regex);
  return (
    <>
      {parts.filter(Boolean).map((part, i) => {
        if (words.includes(part.toLowerCase())) {
          return (
            <mark key={i} className="bg-amber-50 font-medium text-primary not-italic">
              {part}
            </mark>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

export async function SearchResults({ q, page = 1 }: { q: string; page?: number }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("emails")
    .select("id, subject, body_text, received_at, sender_id, is_read, senders(display_name, email_address)")
    .textSearch("search_vector", q, { type: "websearch", config: "english" })
    .eq("is_archived", false)
    .order("received_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const raw = (data ?? []) as unknown as SearchResultRow[];
  const hasMore = raw.length > PAGE_SIZE;
  const results = raw.slice(0, PAGE_SIZE);

  if (results.length === 0 && page <= 1) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1">
        <span className="text-sm text-muted-foreground">No results for</span>
        <span className="text-sm font-medium">{`'${q}'`}</span>
      </div>
    );
  }

  const showFooter = page > 1 || hasMore;

  return (
    <div className="h-full">
      <div className="flex-1 overflow-y-auto p-4 h-full">
        <div className="flex flex-col items-start px-4 py-3">
          <span className="text-lg font-medium">
            Results for <span className="text-primary bg-amber-100">{`${q}`}</span>
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {results.length}
            {hasMore ? "+" : ""} result{results.length !== 1 ? "s" : ""}
          </span>
        </div>
        {results.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">No results on page {page}</div>
        ) : (
          <div className="flex flex-col">
            {results.map((email) => {
              const senderName = email.senders?.display_name || email.senders?.email_address || "Unknown sender";
              const unread = email.is_read === false;
              const snippet = getSnippet(email.body_text, q);
              const emailHref =
                page > 1
                  ? `/inbox?sender=${email.sender_id}&email=${email.id}&q=${encodeURIComponent(q)}&page=${page}`
                  : `/inbox?sender=${email.sender_id}&email=${email.id}&q=${encodeURIComponent(q)}`;
              return (
                <a key={email.id} href={emailHref} className="group flex w-full flex-col px-4 py-4 transition-colors hover:bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={cn("flex-1 truncate text-sm", unread ? "font-medium" : "font-normal text-foreground/80")}>
                      {email.subject || "(no subject)"}
                    </span>
                    <span className="hidden max-w-[160px] shrink-0 truncate text-xs text-muted-foreground sm:block">{senderName}</span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{relativeTime(email.received_at)}</span>
                  </div>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    <HighlightedSnippet snippet={snippet} q={q} />
                  </span>
                </a>
              );
            })}
          </div>
        )}
      </div>
      {showFooter ? (
        <div className="sticky bottom-2 flex items-center justify-center gap-8 px-4 py-3 w-fit mx-auto bg-neutral-200/50 rounded-full backdrop-blur-sm">
          {page > 1 ? (
            <a
              href={`/inbox?q=${encodeURIComponent(q)}&page=${page - 1}`}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Previous
            </a>
          ) : (
            <span className="w-0 hidden" />
          )}
          <span className="text-sm text-muted-foreground">Page {page}</span>
          {hasMore ? (
            <a
              href={`/inbox?q=${encodeURIComponent(q)}&page=${page + 1}`}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Next →
            </a>
          ) : (
            <span className="w-0 hidden" />
          )}
        </div>
      ) : null}
    </div>
  );
}
