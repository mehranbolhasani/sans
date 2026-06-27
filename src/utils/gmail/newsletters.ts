import type { gmail_v1 } from "googleapis";

export function isNewsletter(
  headers: gmail_v1.Schema$MessagePartHeader[],
): boolean {
  if (!headers) return false;

  return headers.some((header) => {
    const name = (header.name ?? "").toLowerCase();
    const value = (header.value ?? "").toLowerCase().trim();

    if (name === "list-unsubscribe") return true;
    if (name === "precedence" && (value === "bulk" || value === "list")) {
      return true;
    }

    return false;
  });
}
