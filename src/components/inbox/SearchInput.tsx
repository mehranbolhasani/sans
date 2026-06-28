"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQ = searchParams.get("q") ?? "";
  const paramStr = searchParams.toString();

  const [value, setValue] = useState(urlQ);
  const [lastParamStr, setLastParamStr] = useState(paramStr);

  if (paramStr !== lastParamStr) {
    setLastParamStr(paramStr);
    setValue(urlQ);
  }

  useEffect(() => {
    if (value === urlQ) return;
    const t = setTimeout(() => {
      if (value.length >= 2) {
        router.push(`/inbox?q=${encodeURIComponent(value)}`);
      } else {
        router.push(`/inbox`);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [value, urlQ, router]);

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Search..."
      className="w-[calc(100%-2rem)] border border-primary/20 bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 my-4 ml-3 rounded-sm focus:bg-white"
    />
  );
}
