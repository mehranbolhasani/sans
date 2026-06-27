"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface EmailReaderClientProps {
  emailId: string;
  isRead: boolean;
  html: string;
}

export function EmailReaderClient({
  emailId,
  isRead,
  html,
}: EmailReaderClientProps) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const markedRef = useRef(false);

  useEffect(() => {
    if (isRead || markedRef.current) return;
    markedRef.current = true;

    fetch(`/api/emails/${emailId}/read`, { method: "PATCH" })
      .then(() => router.refresh())
      .catch(() => {});
  }, [emailId, isRead, router]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let observer: ResizeObserver | null = null;

    const resize = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const height = Math.max(
        doc.body?.scrollHeight ?? 0,
        doc.documentElement?.scrollHeight ?? 0,
      );
      if (height > 0) iframe.style.height = `${height}px`;
    };

    const onLoad = () => {
      resize();
      const body = iframe.contentDocument?.body;
      if (body) {
        observer = new ResizeObserver(resize);
        observer.observe(body);
      }
    };

    iframe.addEventListener("load", onLoad);

    return () => {
      iframe.removeEventListener("load", onLoad);
      observer?.disconnect();
    };
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      sandbox="allow-same-origin allow-popups"
      title="Email content"
      className="block w-full border-0"
      style={{ height: 0 }}
    />
  );
}
