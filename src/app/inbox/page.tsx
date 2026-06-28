import { redirect } from "next/navigation";

import { EmailList } from "@/components/inbox/EmailList";
import { EmailReader } from "@/components/inbox/EmailReader";
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

  let emailIds: string[] = [];
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

  return (
    <>
      {emailId ? (
        <EmailReader emailId={emailId} senderId={senderId ?? ""} />
      ) : senderId ? (
        <EmailList senderId={senderId} />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Select a sender to view emails.</div>
      )}
      <script
        id="inbox-email-ids"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(emailIds) }}
      />
    </>
  );
}
