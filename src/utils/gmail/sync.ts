import type { gmail_v1 } from "googleapis";

import { getGmailClient } from "@/utils/gmail/client";
import { isNewsletter } from "@/utils/gmail/newsletters";
import { parseEmail } from "@/utils/gmail/parser";
import { createServiceClient } from "@/utils/supabase/server";

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 200;
const NEWSLETTER_QUERY = "unsubscribe after:2023/1/1";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

interface MessageRef {
  id: string;
  threadId?: string;
}

async function storeNewsletterEmail(
  userId: string,
  message: gmail_v1.Schema$Message,
): Promise<boolean> {
  const supabase = createServiceClient();
  const headers = message.payload?.headers ?? [];

  if (!isNewsletter(headers)) return false;

  const parsed = parseEmail(message);
  if (!parsed.from.email) return false;

  const { data: senderRows, error: senderError } = await supabase
    .from("senders")
    .upsert(
      {
        user_id: userId,
        email_address: parsed.from.email,
        display_name: parsed.from.displayName,
        last_email_at: parsed.received_at.toISOString(),
      },
      { onConflict: "user_id,email_address" },
    )
    .select("id");

  const senderId = senderRows?.[0]?.id;
  if (senderError || !senderId) return false;

  const { data: inserted } = await supabase
    .from("emails")
    .upsert(
      {
        user_id: userId,
        gmail_message_id: message.id,
        sender_id: senderId,
        subject: parsed.subject,
        body_html: parsed.body_html,
        body_text: parsed.body_text,
        received_at: parsed.received_at.toISOString(),
      },
      { onConflict: "user_id,gmail_message_id", ignoreDuplicates: true },
    )
    .select("id");

  return Boolean(inserted && inserted.length > 0);
}

async function saveSyncState(
  userId: string,
  historyId: string | undefined,
  accessToken?: string,
  tokenExpiresAt?: string,
): Promise<void> {
  if (!historyId) return;

  const supabase = createServiceClient();
  await supabase.from("sync_state").upsert(
    {
      user_id: userId,
      last_history_id: historyId,
      last_synced_at: new Date().toISOString(),
      last_error: null,
      last_error_at: null,
      ...(accessToken ? { access_token: accessToken } : {}),
      ...(tokenExpiresAt ? { token_expires_at: tokenExpiresAt } : {}),
    },
    { onConflict: "user_id" },
  );
}

async function updateHistoryId(
  userId: string,
  historyId: string,
): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("sync_state")
    .update({
      last_history_id: historyId,
      last_synced_at: new Date().toISOString(),
      last_error: null,
      last_error_at: null,
    })
    .eq("user_id", userId);
}

export async function initialSync(
  userId: string,
  accessToken: string,
): Promise<number> {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("sync_state")
    .select("last_history_id, access_token, token_expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.last_history_id) return 0;

  const tokenExpiresAt = existing?.token_expires_at ?? null;

  const gmail = getGmailClient(accessToken);

  let messageIds: string[];
  try {
    const listRes = await gmail.users.messages.list({
      userId: "me",
      q: NEWSLETTER_QUERY,
      maxResults: 50,
    });
    messageIds = (listRes.data.messages ?? [])
      .map((m) => m.id)
      .filter((id): id is string => Boolean(id));
  } catch (error) {
    console.error("Gmail API error (list):", error);
    throw error;
  }

  const chunks = chunk(messageIds, BATCH_SIZE);
  let stored = 0;
  let latestHistoryId: string | undefined;

  for (const chunkIds of chunks) {
    const settled = await Promise.allSettled(
      chunkIds.map((id) =>
        gmail.users.messages.get({ userId: "me", id, format: "full" }),
      ),
    );

    for (const result of settled) {
      if (result.status === "rejected") {
        const err = result.reason as {
          code?: number;
          status?: number;
          response?: { status?: number };
        };
        const code = err?.code ?? err?.response?.status;
        if (code === 404 || err?.status === 404) continue;
        console.warn("Gmail API error (get):", result.reason);
        continue;
      }

      const message = result.value.data;
      if (!message.id) continue;

      if (await storeNewsletterEmail(userId, message)) {
        stored += 1;
      }

      if (message.historyId) latestHistoryId = message.historyId;
    }

    await delay(BATCH_DELAY_MS);
  }

  await saveSyncState(
    userId,
    latestHistoryId,
    accessToken,
    tokenExpiresAt ?? undefined,
  );

  return stored;
}

async function listAddedMessageRefs(
  gmail: gmail_v1.Gmail,
  startHistoryId: string,
): Promise<MessageRef[]> {
  const refs: MessageRef[] = [];
  let pageToken: string | undefined;

  do {
    const res = await gmail.users.history.list({
      userId: "me",
      startHistoryId,
      historyTypes: ["messageAdded"],
      maxResults: 100,
      pageToken,
    });

    for (const record of res.data.history ?? []) {
      for (const added of record.messagesAdded ?? []) {
        const message = added.message;
        if (message?.id) {
          refs.push({
            id: message.id,
            threadId: message.threadId ?? undefined,
          });
        }
      }
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return refs;
}

export async function incrementalSync(
  userId: string,
  accessToken: string,
): Promise<{ synced: number }> {
  const supabase = createServiceClient();

  const { data: state } = await supabase
    .from("sync_state")
    .select("last_history_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!state?.last_history_id) {
    const synced = await initialSync(userId, accessToken);
    return { synced };
  }

  const gmail = getGmailClient(accessToken);
  const startHistoryId = state.last_history_id;

  let refs: MessageRef[];
  try {
    refs = await listAddedMessageRefs(gmail, startHistoryId);
  } catch (error) {
    const code =
      (error as { code?: number }).code ??
      (error as { response?: { status?: number } }).response?.status;
    if (code === 404) {
      const profile = await gmail.users.getProfile({ userId: "me" });
      await updateHistoryId(userId, profile.data.historyId!);
      return { synced: 0 };
    }
    throw error;
  }

  let stored = 0;
  let latestHistoryId: string | undefined;

  for (let i = 0; i < refs.length; i += BATCH_SIZE) {
    const batch = refs.slice(i, i + BATCH_SIZE);

    for (const ref of batch) {
      let message: gmail_v1.Schema$Message;
      try {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("message fetch timeout")), 10000),
        );
        const res = await Promise.race([
          gmail.users.messages.get({
            userId: "me",
            id: ref.id,
            format: "full",
          }),
          timeout,
        ]);
        message = res.data;
      } catch (err) {
        const e = err as {
          code?: number;
          status?: number;
          response?: { status?: number };
        };
        const code = e.code ?? e.response?.status;
        if (code === 404 || e.status === 404) continue;
        throw err;
      }

      if (!message.id) continue;

      if (await storeNewsletterEmail(userId, message)) {
        stored += 1;
      }

      if (message.historyId) latestHistoryId = message.historyId;
    }

    await delay(BATCH_DELAY_MS);
  }

  await saveSyncState(userId, latestHistoryId ?? startHistoryId);

  return { synced: stored };
}
