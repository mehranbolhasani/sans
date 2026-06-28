import { timingSafeEqual } from "crypto";

import { NextResponse } from "next/server";

import { getFreshAccessToken } from "@/utils/gmail/token";
import { incrementalSync } from "@/utils/gmail/sync";
import { createServiceClient } from "@/utils/supabase/server";

function isCronAuthorized(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!authHeader || !secret) return false;

  const expected = `Bearer ${secret}`;
  if (authHeader.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

interface SyncStateUserRow {
  user_id: string;
}

export async function GET(req: Request) {
  if (!isCronAuthorized(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("sync_state")
    .select("user_id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = (data ?? []) as SyncStateUserRow[];

  let syncedUsers = 0;
  let totalNewEmails = 0;

  for (const { user_id } of users) {
    try {
      const accessToken = await getFreshAccessToken(user_id);
      const { synced: newEmails } = await incrementalSync(user_id, accessToken);
      syncedUsers += 1;
      totalNewEmails += newEmails;
    } catch (err) {
      console.error(`[cron sync] user ${user_id} failed:`, err);
      await supabase
        .from("sync_state")
        .update({
          last_error: err instanceof Error ? err.message : "Unknown sync error",
          last_error_at: new Date().toISOString(),
        })
        .eq("user_id", user_id);
    }
  }

  return NextResponse.json({
    synced_users: syncedUsers,
    total_new_emails: totalNewEmails,
  });
}
