"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

export function ReconnectButton() {
  const [loading, setLoading] = useState(false);

  async function handleReconnect() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "https://www.googleapis.com/auth/gmail.readonly",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  }

  return (
    <Button
      variant="outline"
      size="default"
      onClick={handleReconnect}
      disabled={loading}
    >
      {loading ? "Redirecting…" : "Reconnect Gmail"}
    </Button>
  );
}
