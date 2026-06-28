import { createClient } from "@/utils/supabase/server";

import { SearchInput } from "./SearchInput";
import { SenderListClient } from "./SenderListClient";
import { SignOutButton } from "./sign-out-button";

interface SenderRow {
  id: string;
  email_address: string;
  display_name: string | null;
  last_email_at: string;
  emails: { is_read: boolean | null; is_archived: boolean | null }[] | null;
}

export async function SenderList() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("senders")
    .select("id, email_address, display_name, last_email_at, emails(is_read, is_archived)")
    .order("last_email_at", { ascending: false });

  const rows = (data ?? []) as SenderRow[];

  const senders = rows.map((row) => ({
    id: row.id,
    email_address: row.email_address,
    display_name: row.display_name,
    unread_count: (row.emails ?? []).filter((e) => e.is_read === false && e.is_archived === false).length,
  }));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex flex-col items-start gap-0">
          <span className="text-2xl font-normal tracking-tighter">Sans —</span>
          <div className="flex items-center gap-1">
            <span className="text-sm font-normal text-primary/50">Inbox</span>
            <span className="text-sm font-normal text-primary/20">/</span>
            <SignOutButton />
          </div>
        </div>
      </div>
      <SearchInput />
      <SenderListClient senders={senders} />
    </div>
  );
}
