import Link from "next/link";

import { createClient } from "@/utils/supabase/server";

import { ReconnectButton } from "./ReconnectButton";
import { SyncNowButton } from "./SyncNowButton";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: syncState } = await supabase
    .from("sync_state")
    .select("last_synced_at, last_error, last_error_at")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  const lastSyncedAt = syncState?.last_synced_at
    ? new Date(syncState.last_synced_at).toLocaleString()
    : "Never";

  const hasError = Boolean(syncState?.last_error);

  return (
    <div className="flex min-h-svh w-full flex-col items-center bg-neutral-50 px-6 py-10 text-foreground">
      <div className="w-full max-w-xl">
        <Link
          href="/inbox"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          &larr; Back to inbox
        </Link>

        <h1 className="mt-6 text-2xl font-normal tracking-tighter">Settings</h1>

        <div className="mt-8 flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">Account</h2>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-sm">{user?.email ?? "Unknown"}</p>
              <div className="mt-4">
                <ReconnectButton />
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">Sync</h2>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">
                Last synced: <span className="text-foreground">{lastSyncedAt}</span>
              </p>
              {hasError ? (
                <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{syncState?.last_error}</p>
                  {syncState?.last_error_at && (
                    <p className="mt-1 text-xs text-destructive/70">
                      {new Date(syncState.last_error_at).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-sm text-emerald-600">Sync healthy</p>
              )}
              <div className="mt-4">
                <SyncNowButton />
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">Danger Zone</h2>
          </section>
        </div>
      </div>
    </div>
  );
}
