"use client";

import { useActionState, useState } from "react";
import { resetPassword, signIn, signUp } from "@/app/actions/auth";

export function AuthForms({ next }: { next: string }) {
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [loginState, loginAction, loginPending] = useActionState(signIn, undefined);
  const [registerState, registerAction, registerPending] = useActionState(signUp, undefined);
  const [resetState, resetAction, resetPending] = useActionState(resetPassword, undefined);

  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const state = isLogin ? loginState : isRegister ? registerState : resetState;
  const pending = isLogin ? loginPending : isRegister ? registerPending : resetPending;
  const action = isLogin ? loginAction : isRegister ? registerAction : resetAction;

  return (
    <>
      <div className="mt-6 grid grid-cols-2 rounded-xl bg-cream p-1 text-sm font-bold">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg py-2 transition ${mode === m ? "bg-white text-brand shadow" : "text-muted"}`}
          >
            {m === "login" ? "Connexion" : "Créer un compte"}
          </button>
        ))}
      </div>

      <form action={action} className="mt-6 space-y-4" key={mode}>
        <input type="hidden" name="suite" value={next} />
        {isRegister && (
          <label className="block text-sm font-semibold">
            Nom complet
            <input name="full_name" required autoComplete="name" className="input mt-1" placeholder="Votre nom complet" />
          </label>
        )}
        <label className="block text-sm font-semibold">
          Adresse e-mail
          <input name="email" type="email" required autoComplete="email" className="input mt-1" placeholder="nom@exemple.com" />
        </label>
        {mode !== "reset" && (
          <label className="block text-sm font-semibold">
            Mot de passe
            <input
              name="password"
              type="password"
              required
              minLength={isLogin ? undefined : 6}
              autoComplete={isLogin ? "current-password" : "new-password"}
              className="input mt-1"
              placeholder={isLogin ? "Votre mot de passe" : "6 caractères minimum"}
            />
          </label>
        )}
        {state?.error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {state.error}
          </p>
        )}
        {state?.message && (
          <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">
            {state.message}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
          {pending
            ? "Patientez…"
            : isLogin
              ? "Se connecter"
              : isRegister
                ? "Créer mon compte"
                : "Envoyer le lien de réinitialisation"}
        </button>

        {isLogin && (
          <button
            type="button"
            onClick={() => setMode("reset")}
            className="block w-full text-center text-xs font-semibold text-muted underline hover:text-brand"
          >
            Mot de passe oublié ?
          </button>
        )}
        {mode === "reset" && (
          <button
            type="button"
            onClick={() => setMode("login")}
            className="block w-full text-center text-xs font-semibold text-muted underline hover:text-brand"
          >
            ← Retour à la connexion
          </button>
        )}
      </form>
    </>
  );
}
