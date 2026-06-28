"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MarkAllReadButtonProps {
  senderId: string;
  hasUnread: boolean;
}

export function MarkAllReadButton({ senderId, hasUnread }: MarkAllReadButtonProps) {
  const router = useRouter();
  const [marking, setMarking] = useState(false);

  if (!hasUnread) return null;

  return (
    <button
      type="button"
      disabled={marking}
      onClick={async () => {
        setMarking(true);
        try {
          await fetch(`/api/senders/${senderId}/read-all`, { method: "PATCH" });
          router.refresh();
        } finally {
          setMarking(false);
        }
      }}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none disabled:opacity-50"
    >
      {marking ? "Marking..." : "Mark all as read"}
    </button>
  );
}
