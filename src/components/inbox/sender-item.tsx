"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

interface SenderItemProps {
  sender: {
    id: string;
    email_address: string;
    display_name: string | null;
  };
  unreadCount: number;
}

export function SenderItem({ sender, unreadCount }: SenderItemProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("sender") === sender.id;
  const name = sender.display_name || sender.email_address;

  return (
    <button
      type="button"
      onClick={() => router.push(`/inbox?sender=${sender.id}`)}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
        active && "bg-muted font-medium",
      )}
    >
      <span className="truncate">{name}</span>
      {unreadCount > 0 ? (
        <span className="shrink-0 rounded-full bg-muted-foreground/15 px-1.5 text-xs tabular-nums text-muted-foreground">
          {unreadCount}
        </span>
      ) : null}
    </button>
  );
}
