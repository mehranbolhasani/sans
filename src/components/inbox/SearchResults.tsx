import { createClient } from "@/utils/supabase/server";

import { cn } from "@/lib/utils";
import { relativeTime } from "@/utils/relativeTime";

interface SearchResultRow {
  id: string;
  subject: string | null;
  received_at: string;
  sender_id: string;
  is_read: boolean | null;
  senders: { display_name: string | null; email_address: string } | null;
}

export async function SearchResults({ q }: { q: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("emails")
    .select("id, subject, received_at, sender_id, is_read, senders(display_name, email_address)")
    .textSearch("search_vector", q, { type: "websearch", config: "english" })
    .eq("is_archived", false)
    .order("received_at", { ascending: false })
    .limit(30);

  const results = (data ?? []) as unknown as SearchResultRow[];

  if (results.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        {`No results for '${q}'`}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 py-3 text-sm font-medium">Search results</div>
      {results.map((email) => {
        const senderName =
          email.senders?.display_name || email.senders?.email_address || "Unknown sender";
        const unread = email.is_read === false;
        return (
          <a
            key={email.id}
            href={`/inbox?sender=${email.sender_id}&email=${email.id}`}
            className="group flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
          >
            <span
              className={cn(
                "flex-1 truncate text-sm",
                unread ? "font-medium" : "font-normal text-foreground/80",
              )}
            >
              {email.subject || "(no subject)"}
            </span>
            <span className="hidden max-w-[160px] shrink-0 truncate text-xs text-muted-foreground sm:block">
              {senderName}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {relativeTime(email.received_at)}
            </span>
          </a>
        );
      })}
    </div>
  );
}
