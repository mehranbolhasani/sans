"use client";

import { useSearchParams } from "next/navigation";

import { SenderItem } from "./sender-item";
import { SenderSortFilter } from "./SenderSortFilter";

interface Sender {
  id: string;
  email_address: string;
  display_name: string | null;
  unread_count: number;
}

export function SenderListClient({ senders }: { senders: Sender[] }) {
  const searchParams = useSearchParams();
  const sort = searchParams.get("ssort") ?? undefined;
  const filter = searchParams.get("sfilter") ?? undefined;

  let visible = senders;
  if (filter === "unread") {
    visible = visible.filter((s) => s.unread_count > 0);
  }
  if (sort === "name") {
    visible = [...visible].sort((a, b) =>
      (a.display_name ?? a.email_address).localeCompare(b.display_name ?? b.email_address),
    );
  } else if (sort === "unread") {
    visible = [...visible].sort((a, b) => b.unread_count - a.unread_count);
  }

  return (
    <>
      <SenderSortFilter currentSort={sort} currentFilter={filter} />
      <div className="flex-1 overflow-y-auto p-2">
        {visible.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">No senders yet.</p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {visible.map((sender) => (
              <SenderItem key={sender.id} sender={sender} unreadCount={sender.unread_count} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
