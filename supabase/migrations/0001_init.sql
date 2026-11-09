-- Tal Agro Shop — schéma Supabase (PostgreSQL)
-- À exécuter dans Supabase Studio > SQL Editor, ou via `supabase db push`.

-- ─────────────────────────────────────────────────────────────
-- Profils (1-1 avec auth.users, créés automatiquement à l'inscription)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  phone       text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ─────────────────────────────────────────────────────────────
-- Catalogue
-- ─────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id          smallserial primary key,
  slug        text not null unique,
  name        text not null,
  icon        text not null default '🧺',
  description text not null default '',
  sort_order  smallint not null default 0
);

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  category_id smallint not null references public.categories (id),
  price       integer not null check (price >= 0),          -- FCFA
  unit        text not null,
  origin      text not null,
  stock       integer not null default 0 check (stock >= 0),
  tag         text,
  image_url   text,
  description text not null default '',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category_id) where is_active;

-- ─────────────────────────────────────────────────────────────
-- Commandes
-- ─────────────────────────────────────────────────────────────
do $$ begin
  create type public.order_status as enum ('enregistree', 'confirmee', 'en_livraison', 'livree', 'annulee');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('livraison', 'orange_money', 'mtn_momo');
exception when duplicate_object then null; end $$;

create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  number      text not null unique,
  user_id     uuid not null references auth.users (id),
  full_name   text not null,
  phone       text not null,
  region      text not null,
  address     text not null,
  subtotal    integer not null check (subtotal >= 0),
  shipping    integer not null check (shipping >= 0),
  total       integer generated always as (subtotal + shipping) stored,
  payment     public.payment_method not null default 'livraison',
  status      public.order_status not null default 'enregistree',
  created_at  timestamptz not null default now()
);
create index if not exists orders_user_created_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);

create table if not exists public.order_items (
  id           bigint generated always as identity primary key,
  order_id     uuid not null references public.orders (id) on delete cascade,
  product_id   uuid not null references public.products (id),
  product_name text not null,
  unit         text not null,
  unit_price   integer not null check (unit_price >= 0),
  quantity     integer not null check (quantity > 0)
);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.profiles    enable row level security;
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Profils : chacun lit/modifie le sien ; l'admin lit tout.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid()));

-- Catalogue : lecture publique, écriture admin.
drop policy if exists "categories_read" on public.categories;
create policy "categories_read" on public.categories for select using (true);
drop policy if exists "categories_admin" on public.categories;
create policy "categories_admin" on public.categories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products_read" on public.products;
create policy "products_read" on public.products for select using (is_active or public.is_admin());
drop policy if exists "products_admin" on public.products;
create policy "products_admin" on public.products for all using (public.is_admin()) with check (public.is_admin());

-- Commandes : le client voit les siennes, l'admin voit et modifie tout.
-- Aucune policy INSERT : la création passe exclusivement par place_order().
drop policy if exists "orders_select" on public.orders;
create policy "orders_select" on public.orders for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "order_items_select" on public.order_items;
create policy "order_items_select" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));

-- ─────────────────────────────────────────────────────────────
-- place_order : création atomique de commande + décrément des stocks.
-- Le décrément conditionnel (stock >= qty) évite les verrous longs et la survente.
-- items = [{"product_id": "<uuid>", "quantity": 2}, ...]
-- ─────────────────────────────────────────────────────────────
create or replace function public.place_order(
  p_phone    text,
  p_region   text,
  p_address  text,
  p_shipping integer,
  p_payment  public.payment_method,
  p_items    jsonb
)
returns public.orders
language plpgsql
security definer set search_path = public
as $$
declare
  v_user     uuid := auth.uid();
  v_name     text;
  v_order    public.orders;
  v_subtotal integer := 0;
  v_item     record;
  v_product  public.products;
begin
  if v_user is null then
    raise exception 'Connectez-vous pour commander.' using errcode = '28000';
  end if;
  if coalesce(trim(p_phone), '') = '' or coalesce(trim(p_region), '') = '' or coalesce(trim(p_address), '') = '' then
    raise exception 'Téléphone, région et adresse sont obligatoires.' using errcode = '22023';
  end if;
  if p_shipping not in (2000, 3000, 4000) then
    raise exception 'Frais de livraison invalides.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 30 then
    raise exception 'Le panier est vide ou trop volumineux.' using errcode = '22023';
  end if;

  select full_name into v_name from public.profiles where id = v_user;

  insert into public.orders (number, user_id, full_name, phone, region, address, subtotal, shipping, payment)
  values (
    'TAS-' || to_char(now() at time zone 'Africa/Douala', 'YYYYMMDD') || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 6)),
    v_user, coalesce(v_name, ''), left(trim(p_phone), 40), left(p_region, 40), left(trim(p_address), 300),
    0, p_shipping, p_payment
  )
  returning * into v_order;

  for v_item in
    select (e ->> 'product_id')::uuid as product_id, sum((e ->> 'quantity')::int) as quantity
    from jsonb_array_elements(p_items) e
    group by 1
  loop
    if v_item.quantity is null or v_item.quantity < 1 then
      raise exception 'Quantité invalide.' using errcode = '22023';
    end if;

    update public.products
       set stock = stock - v_item.quantity, updated_at = now()
     where id = v_item.product_id and is_active and stock >= v_item.quantity
    returning * into v_product;

    if not found then
      raise exception 'Un article n''est plus disponible dans cette quantité.' using errcode = 'P0001';
    end if;

    insert into public.order_items (order_id, product_id, product_name, unit, unit_price, quantity)
    values (v_order.id, v_product.id, v_product.name, v_product.unit, v_product.price, v_item.quantity);

    v_subtotal := v_subtotal + v_product.price * v_item.quantity;
  end loop;

  update public.orders set subtotal = v_subtotal where id = v_order.id returning * into v_order;
  return v_order;
end;
$$;

revoke all on function public.place_order(text, text, text, integer, public.payment_method, jsonb) from public, anon;
grant execute on function public.place_order(text, text, text, integer, public.payment_method, jsonb) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Bucket Supabase Storage pour les photos produits (`products`)
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

drop policy if exists "products_storage_public_read" on storage.objects;
create policy "products_storage_public_read" on storage.objects
  for select using (bucket_id = 'products');

drop policy if exists "products_storage_admin_write" on storage.objects;
create policy "products_storage_admin_write" on storage.objects
  for all using (bucket_id = 'products' and public.is_admin())
  with check (bucket_id = 'products' and public.is_admin());
