import { NextResponse } from "next/server";

import { getFreshAccessToken } from "@/utils/gmail/token";
import { incrementalSync } from "@/utils/gmail/sync";
import {
  createClient,
  createServiceClient,
} from "@/utils/supabase/server";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceClient();
  const { data: existingState } = await serviceClient
    .from("sync_state")
    .select("user_id, refresh_token")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingState?.refresh_token) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const providerToken = session?.provider_token;
    const providerRefreshToken = session?.provider_refresh_token;

    if (!providerToken || !providerRefreshToken) {
      return NextResponse.json(
        { error: "No Google tokens in session" },
        { status: 401 },
      );
    }

    if (!existingState) {
      await serviceClient.from("sync_state").upsert(
        {
          user_id: user.id,
          access_token: providerToken,
          refresh_token: providerRefreshToken,
          token_expires_at: new Date(
            Date.now() + 60 * 60 * 1000,
          ).toISOString(),
        },
        { onConflict: "user_id" },
      );
    } else {
      await serviceClient
        .from("sync_state")
        .update({
          access_token: providerToken,
          refresh_token: providerRefreshToken,
          token_expires_at: new Date(
            Date.now() + 60 * 60 * 1000,
          ).toISOString(),
        })
        .eq("user_id", user.id);
    }
  }

  try {
    const accessToken = await getFreshAccessToken(user.id);
    const { synced } = await Promise.race([
      incrementalSync(user.id, accessToken),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Sync timeout after 25s")), 25000),
      ),
    ]);
    await serviceClient
      .from("sync_state")
      .update({
        last_error: null,
        last_error_at: null,
      })
      .eq("user_id", user.id);
    return NextResponse.json({ success: true, synced });
  } catch (error) {
    console.error("[sync] error:", error);
    await serviceClient
      .from("sync_state")
      .update({
        last_error: error instanceof Error ? error.message : "Unknown sync error",
        last_error_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
    const message =
      error instanceof Error ? error.message : "Sync failed unexpectedly";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
