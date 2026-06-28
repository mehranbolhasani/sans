import { redirect } from "next/navigation";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { createClient } from "@/utils/supabase/server";

export default async function AuthPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  const params = await searchParams;

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 text-foreground">
      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-2xl font-normal tracking-tighter">Sans —</h1>
          <p className="font-light tracking-tight text-primary/50">Sign in to read your inbox.</p>
        </div>
        <GoogleSignInButton showError={params.error === "true"} />
      </div>
    </main>
  );
}
