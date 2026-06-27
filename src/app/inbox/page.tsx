import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export default async function InboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background text-foreground">
      <h1 className="text-2xl font-semibold tracking-tight">
        Inbox coming soon
      </h1>
    </main>
  );
}
