import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const origin =
    forwardedProto && forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${origin}/auth?error=true`);
    }

    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    void fetch(`${origin}/api/sync`, {
      method: "POST",
      headers: { cookie: cookieHeader },
    }).catch(() => {});
  }

  return NextResponse.redirect(`${origin}/inbox`);
}
