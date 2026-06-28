import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface SyncStatusProps {
  syncState: {
    last_synced_at: string | null;
    last_error: string | null;
    last_history_id: string | null;
  } | null;
}

export function SyncStatus({ syncState }: SyncStatusProps) {
  if (!syncState) return null;

  if (syncState.last_history_id === null) {
    return (
      <div className="px-4 py-1 text-xs text-muted-foreground">
        Initial sync in progress...
      </div>
    );
  }

  if (syncState.last_error) {
    return (
      <div className="flex items-center gap-1.5 px-4 py-1 text-xs">
        <span className="size-1.5 rounded-full bg-destructive" />
        <span className="text-muted-foreground">Sync error</span>
        <span className="text-muted-foreground/50">·</span>
        <Link href="/settings" className="text-destructive hover:underline">
          Fix
        </Link>
      </div>
    );
  }

  if (!syncState.last_synced_at) return null;

  const syncedAt = new Date(syncState.last_synced_at);
  // eslint-disable-next-line react-hooks/purity -- server component; staleness is inherently time-based
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const isStale = syncedAt < twoHoursAgo;

  const relative = formatDistanceToNow(syncedAt, { addSuffix: true });

  if (isStale) {
    return (
      <div className="flex items-center gap-1.5 px-4 py-1 text-xs">
        <span className="size-1.5 rounded-full bg-yellow-500" />
        <span className="text-muted-foreground capitalize">Synced {relative}</span>
      </div>
    );
  }

  return (
    <div className="px-4 py-1 text-xs text-muted-foreground capitalize">
      Synced {relative}
    </div>
  );
}
