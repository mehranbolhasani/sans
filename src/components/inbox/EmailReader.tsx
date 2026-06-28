import { createClient } from "@/utils/supabase/server";

import { EmailReaderClient } from "./email-reader-client";

interface EmailData {
  id: string;
  subject: string | null;
  body_html: string | null;
  received_at: string;
  is_read: boolean | null;
  senders: { email_address: string; display_name: string | null } | null;
}

export async function EmailReader({ emailId, senderId, backQuery, backPage }: { emailId: string; senderId: string; backQuery?: string; backPage?: number }) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("emails")
    .select(
      "id, subject, body_html, received_at, is_read, senders(email_address, display_name)",
    )
    .eq("id", emailId)
    .maybeSingle();

  const email = data as EmailData | null;

  if (!email) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Email not found.
      </div>
    );
  }

  const senderName =
    email.senders?.display_name || email.senders?.email_address || "Unknown sender";
  const formattedDate = new Date(email.received_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const backHref = backQuery
    ? `/inbox?q=${encodeURIComponent(backQuery)}${backPage && backPage > 1 ? `&page=${backPage}` : ""}`
    : `/inbox?sender=${senderId}`;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[680px] px-6 py-8">
        <div className="mb-4">
          <a
            href={backHref}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {backQuery ? "← Search results" : "← Back"}
          </a>
        </div>
        <header className="mb-6 border-b border-border pb-6">
          <h1 className="text-xl font-semibold tracking-tight">
            {email.subject || "(no subject)"}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{senderName}</span>
            <span aria-hidden>·</span>
            <time>{formattedDate}</time>
          </div>
        </header>
        <EmailReaderClient
          emailId={email.id}
          isRead={email.is_read !== false}
          html={email.body_html ?? ""}
        />
      </div>
    </div>
  );
}
