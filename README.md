# Tal Agro Shop — Version Next.js + Supabase

Plateforme e-commerce de produits agricoles et d'élevage au Cameroun (Bafoussam, Région de l'Ouest), refondue avec **Next.js (App Router, Cache Components, Tailwind CSS)** et **Supabase (PostgreSQL, Auth, RLS)**.

## 1. Configurer Supabase

1. Créez un projet gratuit sur [supabase.com](https://supabase.com).
2. Ouvrez **SQL Editor** dans votre tableau de bord Supabase :
   - Exécutez le contenu de [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) (création des tables, politiques Row Level Security et fonction transactionnelle `place_order`).
   - Exécutez le contenu de [`supabase/seed.sql`](./supabase/seed.sql) (insertion des 6 catégories et des 24 produits du catalogue).
3. Récupérez vos clés dans **Project Settings > API** (`Project URL` et `anon public key`).

## 2. Configurer et lancer l'application

```bash
cd web
cp .env.example .env.local
# Éditez .env.local avec vos valeurs NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY

npm run dev
```

Ouvrez ensuite [http://localhost:3000](http://localhost:3000).

## 3. Donner les droits Administrateur (`/admin`)

Après avoir créé votre compte sur le site (`/connexion`), rendez-vous dans le **SQL Editor** de Supabase et exécutez :

```sql
update public.profiles
set is_admin = true
where id = (select id from auth.users where email = 'votre-email@exemple.com');
```

Vous aurez alors accès au tableau de bord `/admin` pour modifier les prix, ajuster les stocks en temps réel et mettre à jour le statut des commandes.
