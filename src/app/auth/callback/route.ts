/**
 * @file auth/callback/route.ts
 * @description Point de retour (Callback) après clic sur un lien de confirmation d'e-mail Supabase.
 * Échange le code ou le jeton OTP contre une session active, puis redirige vers `/compte`.
 */

import { NextResponse, type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/compte";

  const supabase = await createClient();
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  } else if (tokenHash && type) {
    await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  }

  return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/compte"}`);
}
