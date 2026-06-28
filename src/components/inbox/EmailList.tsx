import { createClient } from "@/utils/supabase/server";

import { EmailItem } from "./email-item";
import { MarkAllReadButton } from "./mark-all-read-button";

interface EmailRow {
  id: string;
  subject: string | null;
  received_at: string;
  is_read: boolean | null;
  is_archived: boolean | null;
}

export async function EmailList({ senderId }: { senderId: string }) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("emails")
    .select("id, subject, received_at, is_read, is_archived")
    .eq("sender_id", senderId)
    .eq("is_archived", false)
    .order("received_at", { ascending: false })
    .limit(50);

  const emails = (data ?? []) as EmailRow[];
  const hasUnread = emails.some((e) => e.is_read === false);

  if (emails.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No emails from this sender.</div>;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 text-sm font-medium">
        <span>Emails</span>
        <MarkAllReadButton senderId={senderId} hasUnread={hasUnread} />
      </div>
      {emails.map((email) => (
        <EmailItem key={email.id} email={email} senderId={senderId} />
      ))}
    </div>
  );
}
