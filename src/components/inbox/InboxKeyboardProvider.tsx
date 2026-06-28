"use client";

import { useInboxKeyboard } from "@/hooks/useInboxKeyboard";

export function InboxKeyboardProvider() {
  useInboxKeyboard();
  return null;
}
