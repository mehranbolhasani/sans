"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useInboxKeyboard() {
  const router = useRouter();

  useEffect(() => {
    function getIds(scriptId: string): string[] {
      const el = document.getElementById(scriptId);
      if (!el) return [];
      try {
        return JSON.parse(el.textContent ?? "[]");
      } catch {
        return [];
      }
    }

    function handler(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const senderId = new URLSearchParams(window.location.search).get("sender");
      const emailId = new URLSearchParams(window.location.search).get("email");
      const senderIds = getIds("inbox-sender-ids");
      const emailIds = getIds("inbox-email-ids");

      switch (e.key) {
        case "j": {
          if (!senderId || !emailIds.length) break;
          const idx = emailId ? emailIds.indexOf(emailId) : -1;
          const next = emailIds[idx + 1];
          if (next) router.push(`/inbox?sender=${senderId}&email=${next}`);
          break;
        }
        case "k": {
          if (!senderId || !emailId || !emailIds.length) break;
          const idx = emailIds.indexOf(emailId);
          const prev = emailIds[idx - 1];
          if (prev) router.push(`/inbox?sender=${senderId}&email=${prev}`);
          break;
        }
        case "n": {
          if (!senderIds.length) break;
          const idx = senderId ? senderIds.indexOf(senderId) : -1;
          const next = senderIds[idx + 1];
          if (next) router.push(`/inbox?sender=${next}`);
          break;
        }
        case "p": {
          if (!senderIds.length || !senderId) break;
          const idx = senderIds.indexOf(senderId);
          const prev = senderIds[idx - 1];
          if (prev) router.push(`/inbox?sender=${prev}`);
          break;
        }
        case "e": {
          if (!emailId || !senderId) break;
          fetch(`/api/emails/${emailId}/archive`, { method: "PATCH" })
            .then(() => router.push(`/inbox?sender=${senderId}`))
            .then(() => router.refresh());
          break;
        }
        case "u":
        case "Escape": {
          if (emailId && senderId) router.push(`/inbox?sender=${senderId}`);
          else if (senderId) router.push(`/inbox`);
          break;
        }
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);
}
