import type { gmail_v1 } from "googleapis";

import { isNewsletter } from "@/utils/gmail/newsletters";

export interface ParsedEmail {
  subject: string;
  from: {
    displayName: string;
    email: string;
  };
  received_at: Date;
  body_html: string;
  body_text: string;
  isNewsletter: boolean;
}

function getHeader(
  headers: gmail_v1.Schema$MessagePartHeader[],
  name: string,
): string {
  const header = headers.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase(),
  );
  return header?.value ?? "";
}

function parseFromHeader(from: string): {
  displayName: string;
  email: string;
} {
  const match = from.match(/<([^>]+)>/);
  if (match) {
    const email = match[1].trim();
    const displayName = from.slice(0, match.index).replace(/"/g, "").trim();
    return { displayName, email };
  }

  const value = from.trim();
  if (/^[^\s@]+@[^\s@]+$/.test(value)) {
    return { displayName: "", email: value };
  }

  return { displayName: value, email: "" };
}

function extractBodies(
  payload: gmail_v1.Schema$MessagePart | undefined,
  html: string[],
  text: string[],
): void {
  if (!payload) return;

  const mimeType = payload.mimeType ?? "";
  const data = payload.body?.data;

  if (data) {
    const decoded = Buffer.from(data, "base64url").toString("utf-8");
    if (mimeType === "text/html") {
      html.push(decoded);
    } else if (mimeType === "text/plain") {
      text.push(decoded);
    }
  }

  for (const part of payload.parts ?? []) {
    extractBodies(part, html, text);
  }
}

export function parseEmail(message: gmail_v1.Schema$Message): ParsedEmail {
  const headers = message.payload?.headers ?? [];

  const subject = getHeader(headers, "Subject");
  const from = parseFromHeader(getHeader(headers, "From"));
  const dateHeader = getHeader(headers, "Date");
  const received_at = dateHeader ? new Date(dateHeader) : new Date();

  const html: string[] = [];
  const text: string[] = [];
  extractBodies(message.payload, html, text);

  return {
    subject,
    from,
    received_at,
    body_html: html.join(""),
    body_text: text.join(""),
    isNewsletter: isNewsletter(headers),
  };
}
