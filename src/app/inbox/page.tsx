import { redirect } from "next/navigation";

import { EmailList } from "@/components/inbox/EmailList";
import { EmailReader } from "@/components/inbox/EmailReader";
import { SearchResults } from "@/components/inbox/SearchResults";
import { createClient } from "@/utils/supabase/server";

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const sp = await searchParams;
  const senderId = typeof sp.sender === "string" ? sp.sender : undefined;
  const emailId = typeof sp.email === "string" ? sp.email : undefined;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const page = typeof sp.page === "string" ? Math.max(1, parseInt(sp.page, 10) || 1) : 1;

  const searching = typeof q === "string" && q.length >= 2;

  let senderIds: string[] = [];
  let emailIds: string[] = [];

  if (!searching) {
    const { data: senderRows } = await supabase
      .from("senders")
      .select("id")
      .order("last_email_at", { ascending: false });
    senderIds = (senderRows ?? []).map((row) => row.id);

    if (senderId) {
      const { data: emailIdRows } = await supabase
        .from("emails")
        .select("id")
        .eq("sender_id", senderId)
        .eq("is_archived", false)
        .order("received_at", { ascending: false })
        .limit(50);
      emailIds = (emailIdRows ?? []).map((row) => row.id);
    }
  }

  return (
    <>
      {emailId ? (
        <EmailReader emailId={emailId} senderId={senderId ?? ""} backQuery={q} backPage={page} />
      ) : searching && q ? (
        <SearchResults q={q} page={page} />
      ) : senderId ? (
        <EmailList senderId={senderId} />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Select a sender to view emails.</div>
      )}
      <script
        id="inbox-sender-ids"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(senderIds) }}
      />
      <script
        id="inbox-email-ids"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(emailIds) }}
      />
    </>
  );
}
