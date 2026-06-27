import { createClient } from "@/utils/supabase/server";

import { SenderItem } from "./sender-item";
import { SignOutButton } from "./sign-out-button";

interface SenderRow {
  id: string;
  email_address: string;
  display_name: string | null;
  last_email_at: string;
  emails: { is_read: boolean | null }[] | null;
}

export async function SenderList() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("senders")
    .select("id, email_address, display_name, last_email_at, emails(is_read)")
    .order("last_email_at", { ascending: false });

  const rows = (data ?? []) as SenderRow[];

  const senders = rows.map((row) => ({
    id: row.id,
    email_address: row.email_address,
    display_name: row.display_name,
    unread_count: (row.emails ?? []).filter((e) => e.is_read === false).length,
  }));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-medium">Inbox</span>
        <SignOutButton />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {senders.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">
            No senders yet.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {senders.map((sender) => (
              <SenderItem
                key={sender.id}
                sender={sender}
                unreadCount={sender.unread_count}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
