import Link from "next/link";
import { Settings } from "lucide-react";

import { SenderList } from "@/components/inbox/SenderList";
import { InboxKeyboardProvider } from "@/components/inbox/InboxKeyboardProvider";
import { createClient } from "@/utils/supabase/server";

import { SyncStatus } from "./_components/SyncStatus";

export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: syncState } = await supabase
    .from("sync_state")
    .select("last_synced_at, last_error, last_history_id")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  return (
    <div className="flex h-svh overflow-hidden bg-neutral-100 text-foreground w-full p-8">
      <InboxKeyboardProvider />
      <aside className="flex h-full w-[280px] shrink-0 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-hidden">
          <SenderList />
        </div>
        <SyncStatus syncState={syncState} />
        <div className="flex items-center px-4 py-3">
          <Link
            href="/settings"
            aria-label="Settings"
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="size-4" />
          </Link>
        </div>
      </aside>
      <section className="h-full flex-1 overflow-hidden bg-background rounded-2xl">{children}</section>
    </div>
  );
}
