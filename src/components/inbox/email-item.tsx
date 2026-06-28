"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { relativeTime } from "@/utils/relativeTime";

interface EmailItemProps {
  email: {
    id: string;
    subject: string | null;
    received_at: string;
    is_read: boolean | null;
    is_archived: boolean | null;
  };
  senderId: string;
}

export function EmailItem({ email, senderId }: EmailItemProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("email") === email.id;
  const unread = email.is_read === false;

  return (
    <button
      type="button"
      onClick={() => router.push(`/inbox?sender=${senderId}&email=${email.id}`)}
      aria-current={active ? "true" : undefined}
      className={cn("group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50", active && "bg-muted/50")}
    >
      <span className={cn("size-2 shrink-0 rounded-full", unread ? "bg-foreground" : "bg-transparent")} />
      <span className={cn("flex-1 truncate text-sm", unread ? "font-semibold" : "font-normal text-foreground/80")}>
        {email.subject || "(no subject)"}
      </span>
      <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(email.received_at)}</span>
      <span
        role="button"
        tabIndex={0}
        onClick={async (ev) => {
          ev.stopPropagation();
          await fetch(`/api/emails/${email.id}/archive`, { method: "PATCH" });
          if (active) router.push(`/inbox?sender=${senderId}`);
          router.refresh();
        }}
        className="shrink-0 opacity-0 transition-opacity text-xs text-muted-foreground hover:text-foreground group-hover:opacity-100"
        aria-label="Archive"
      >
        Archive
      </span>
    </button>
  );
}
