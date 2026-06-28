"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

interface SenderSortFilterProps {
  currentSort?: string;
  currentFilter?: string;
}

export function SenderSortFilter({ currentSort, currentFilter }: SenderSortFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.replace(qs ? `/inbox?${qs}` : "/inbox");
  };

  const sort = currentSort ?? "latest";
  const unreadOnly = currentFilter === "unread";

  return (
    <div className="flex items-center gap-3 px-4 pb-1 text-xs text-muted-foreground">
      <select
        value={sort}
        onChange={(e) => update("ssort", e.target.value === "latest" ? null : e.target.value)}
        aria-label="Sort senders"
        className="bg-transparent text-xs outline-none transition-colors hover:text-foreground cursor-pointer"
      >
        <option value="latest">Latest</option>
        <option value="name">Name</option>
        <option value="unread">Unread</option>
      </select>
      <button
        type="button"
        onClick={() => update("sfilter", unreadOnly ? null : "unread")}
        aria-pressed={unreadOnly}
        className={cn(
          "transition-colors hover:text-foreground cursor-pointer",
          unreadOnly && "text-foreground font-medium",
        )}
      >
        Unread only
      </button>
    </div>
  );
}
