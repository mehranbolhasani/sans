import { redirect } from "next/navigation";

import { EmailList } from "@/components/inbox/EmailList";
import { EmailReader } from "@/components/inbox/EmailReader";
import { SenderList } from "@/components/inbox/SenderList";
import { createClient } from "@/utils/supabase/server";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
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

  return (
    <div className="flex h-svh overflow-hidden bg-background text-foreground">
      <aside className="h-full w-[280px] shrink-0 overflow-hidden border-r border-border">
        <SenderList />
      </aside>
      <section className="h-full flex-1 overflow-hidden">
        {emailId ? (
          <EmailReader emailId={emailId} />
        ) : senderId ? (
          <EmailList senderId={senderId} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Select a sender to view emails.
          </div>
        )}
      </section>
    </div>
  );
}
