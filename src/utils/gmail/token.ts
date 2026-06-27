import { createServiceClient } from "@/utils/supabase/server";

const REFRESH_WINDOW_MS = 5 * 60 * 1000;
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

interface SyncStateTokenRow {
  access_token: string | null;
  token_expires_at: string | null;
  refresh_token: string | null;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

interface GoogleTokenError {
  error?: string;
  error_description?: string;
}

export async function getFreshAccessToken(userId: string): Promise<string> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("sync_state")
    .select("access_token, token_expires_at, refresh_token")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read token state: ${error.message}`);
  }

  const state = data as SyncStateTokenRow | null;

  if (!state) {
    throw new Error(
      "No sync_state record for user; complete sign-in and an initial sync first.",
    );
  }

  if (!state.refresh_token) {
    throw new Error("No refresh token stored for user; re-authenticate with Google.");
  }

  const expiresAtMs = state.token_expires_at
    ? new Date(state.token_expires_at).getTime()
    : 0;

  if (state.access_token && expiresAtMs - Date.now() > REFRESH_WINDOW_MS) {
    return state.access_token;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables.",
    );
  }

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: state.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as GoogleTokenError;
      detail = body.error_description || body.error || "";
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(
      `Google token refresh failed (${res.status}): ${
        detail || "refresh token may be revoked"
      }`,
    );
  }

  const token = (await res.json()) as GoogleTokenResponse;
  const newExpiresAt = new Date(
    Date.now() + token.expires_in * 1000,
  ).toISOString();

  const update: Record<string, string> = {
    access_token: token.access_token,
    token_expires_at: newExpiresAt,
  };
  if (token.refresh_token) update.refresh_token = token.refresh_token;

  await supabase.from("sync_state").update(update).eq("user_id", userId);

  return token.access_token;
}
