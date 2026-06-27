"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await fetch("/auth/signout", { method: "POST" });
    } finally {
      router.push("/auth");
    }
  }

  return (
    <Button
      variant="link"
      size="sm"
      onClick={handleSignOut}
      disabled={loading}
      className="h-auto p-0 text-xs font-normal text-muted-foreground hover:text-foreground"
    >
      Sign out
    </Button>
  );
}
