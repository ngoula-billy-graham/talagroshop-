import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { AuthForms } from "./auth-forms";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default function LoginPage({ searchParams }: PageProps<"/connexion">) {
  return (
    <div className="wrap flex justify-center py-8 sm:py-14">
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-5 shadow-xl sm:p-8">
        <h1 className="font-display text-2xl font-extrabold text-brand sm:text-3xl">Votre compte</h1>
        <p className="mt-2 text-sm text-muted">
          Connectez-vous ou créez un compte pour commander et retrouver vos reçus.
        </p>
        <Suspense fallback={<div className="mt-6 h-64 animate-pulse rounded-2xl bg-cream" />}>
          <LoginFormLoader searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function LoginFormLoader({ searchParams }: { searchParams: PageProps<"/connexion">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  return <AuthForms next={typeof sp.suite === "string" ? sp.suite : "/compte"} />;
}
