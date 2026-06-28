import { createClient } from "@/utils/supabase/server";

import { EmailItem } from "./email-item";

interface EmailRow {
  id: string;
  subject: string | null;
  received_at: string;
  is_read: boolean | null;
}

export async function EmailList({ senderId }: { senderId: string }) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("emails")
    .select("id, subject, received_at, is_read")
    .eq("sender_id", senderId)
    .order("received_at", { ascending: false })
    .limit(50);

  const emails = (data ?? []) as EmailRow[];

  if (emails.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No emails from this sender.</div>;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 py-3 text-sm font-medium">Emails</div>
      {emails.map((email) => (
        <EmailItem key={email.id} email={email} senderId={senderId} />
      ))}
    </div>
  );
}
