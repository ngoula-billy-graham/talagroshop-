/**
 * @file actions/auth.ts
 * @description Server Actions d'authentification (connexion, inscription, réinitialisation et déconnexion) via Supabase Auth.
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/auth";
import { PAYMENT_LABELS, REGIONS, type DeliveryProfile, type PaymentMethod } from "@/lib/types";

export type AuthState = { error?: string; message?: string } | undefined;

/**
 * Retourne les coordonnées de livraison enregistrées du client connecté
 * pour pré-remplir automatiquement le tiroir de commande (`CartDrawer`).
 */
export async function getDeliveryProfileAction(): Promise<DeliveryProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return {
    fullName: user.fullName,
    phone: user.phone,
    region: user.region,
    address: user.address,
    payment: user.payment,
  };
}

/**
 * Enregistre ou met à jour les coordonnées de livraison par défaut du client depuis `/compte`.
 */
export async function updateDeliveryProfile(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Veuillez vous connecter pour modifier votre profil." };

  const fullName = String(formData.get("full_name") ?? "").trim().slice(0, 100);
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 40);
  const region = String(formData.get("region") ?? "Ouest").trim();
  const address = String(formData.get("address") ?? "").trim().slice(0, 300);
  const payment = String(formData.get("payment") ?? "livraison") as PaymentMethod;

  if (!fullName) return { error: "Veuillez indiquer votre nom complet." };
  if (phone && !/^[+\d\s().-]{8,20}$/.test(phone)) return { error: "Numéro de téléphone invalide." };
  if (!(REGIONS as readonly string[]).includes(region)) return { error: "Région invalide." };
  if (!(payment in PAYMENT_LABELS)) return { error: "Mode de paiement invalide." };

  const supabase = await createClient();
  const [{ error: profileErr }, { error: authErr }] = await Promise.all([
    supabase
      .from("profiles")
      .update({ full_name: fullName, phone: phone || null })
      .eq("id", user.id),
    supabase.auth.updateUser({
      data: { full_name: fullName, phone, region, address, payment },
    }),
  ]);

  if (profileErr || authErr) {
    return { error: profileErr?.message || authErr?.message || "Impossible de mettre à jour le profil." };
  }

  revalidatePath("/", "layout");
  return { message: "Vos coordonnées de livraison ont été enregistrées." };
}

/** Empêche les redirections ouvertes (Open Redirect) en ne conservant que les chemins internes */
const safeNext = (value: FormDataEntryValue | null) => {
  const next = String(value ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/compte";
};

/**
 * Connecte un utilisateur existant avec son e-mail et son mot de passe.
 */
export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: "Supabase n’est pas configuré (voir .env.example)." };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Adresse e-mail ou mot de passe incorrect." };
  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("suite")));
}

/**
 * Crée un nouveau compte utilisateur dans `auth.users`.
 * Le trigger SQL `on_auth_user_created` crée automatiquement la ligne correspondante dans `public.profiles`.
 */
export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: "Supabase n’est pas configuré (voir .env.example)." };
  const fullName = String(formData.get("full_name") ?? "").trim().slice(0, 100);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6) {
    return { error: "Indiquez votre nom, une adresse e-mail valide et un mot de passe d’au moins 6 caractères." };
  }
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://talagroshop.vercel.app";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });
  if (error) {
    if (error.code === "user_already_exists") {
      return { error: "Un compte existe déjà avec cette adresse e-mail. Cliquez sur l’onglet « Connexion »." };
    }
    return { error: error.message };
  }
  if (!data.session) {
    return { message: "Compte créé ! Vérifiez votre boîte e-mail pour confirmer votre adresse, puis connectez-vous." };
  }
  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("suite")));
}

/**
 * Envoie un e-mail de réinitialisation de mot de passe via Supabase Auth.
 */
export async function resetPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: "Supabase n’est pas configuré (voir .env.example)." };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Indiquez une adresse e-mail valide." };
  }
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://talagroshop.vercel.app";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/compte`,
  });
  if (error) return { error: error.message };
  return { message: "Si un compte existe avec cette adresse, un lien de réinitialisation vous a été envoyé par e-mail." };
}

/**
 * Déconnecte l'utilisateur courant et supprime son cookie de session.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
