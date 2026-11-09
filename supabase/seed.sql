-- Tal Agro Shop — données initiales du catalogue (reprises de l'ancien app.js)
insert into public.categories (slug, name, icon, description, sort_order) values
  ('maraicher',   'Maraîcher',                 '🥬', 'Légumes frais',        1),
  ('tubercules',  'Tubercules',                '🍠', 'Racines',              2),
  ('elevage',     'Élevage',                   '🐓', 'Animaux & œufs',       3),
  ('fruits',      'Fruits',                    '🍌', 'Fruits locaux',        4),
  ('transformes', 'Transformés',               '🥜', 'Produits locaux',      5),
  ('cereales',    'Céréales & légumineuses',   '🌾', 'Maïs, riz, haricots',  6)
on conflict (slug) do nothing;

with c as (select id, slug from public.categories)
insert into public.products (slug, name, category_id, price, unit, origin, stock, tag, image_url)
select v.slug, v.name, c.id, v.price, v.unit, v.origin, v.stock, v.tag,
       'https://images.unsplash.com/' || v.img || '?auto=format&fit=crop&w=900&q=75'
from (values
  ('tomates-fraiches',     'Tomates fraîches',     'maraicher',   1800, 'cuvette · 5 kg',      'Ouest',      22, 'Récolte du jour',     'photo-1546094096-0df4bcaaa337'),
  ('manioc-baton',         'Manioc bâton',         'tubercules',   900, 'botte · 3 kg',        'Centre',     35, 'Très demandé',        'photo-1757281096972-10fd02b0f5ea'),
  ('piment-frais',         'Piment frais',         'maraicher',   1200, 'tas · 500 g',         'Littoral',   18, 'Local',               'photo-1588252303782-cb80119abd6d'),
  ('oeufs-fermiers',       'Œufs fermiers',        'elevage',     3000, 'plateau · 30 œufs',   'Centre',     14, 'Élevage local',       'photo-1506976785307-8732e854ad03'),
  ('pommes-de-terre',      'Pommes de terre',      'tubercules',  2500, 'sac · 10 kg',         'Nord-Ouest',  0, 'Bientôt disponible',  'photo-1518977676601-b53f82aba655'),
  ('plantain-mur',         'Plantain mûr',         'fruits',      2200, 'régime · env. 5 kg',  'Littoral',   16, 'Mûr à point',         'photo-1603833665858-e61d17a86224'),
  ('poulet-fermier',       'Poulet fermier',       'elevage',     6500, 'tête · env. 1,8 kg',  'Ouest',       8, 'Sur commande',        'photo-1587593810167-a84920ea0781'),
  ('arachides-grillees',   'Arachides grillées',   'transformes', 1500, 'sachet · 500 g',      'Centre',     42, 'Prêt à déguster',     'photo-1567892737950-30c4db37cd89'),
  ('oignons-rouges',       'Oignons rouges',       'maraicher',   1600, 'tas · 2 kg',          'Nord-Ouest', 26, 'Bonne conservation',  'photo-1508747703725-719777637510'),
  ('poussins-d-un-jour',   'Poussins d’un jour',   'elevage',      850, 'unité · minimum 10',  'Ouest',      40, 'Réservation requise', 'photo-1548550023-2bdb3c5beed7'),
  ('avocats',              'Avocats',              'fruits',      2000, 'lot · 6 pièces',      'Centre',     12, 'De saison',           'photo-1523049673857-eb18f1d7b578'),
  ('farine-de-mais',       'Farine de maïs',       'transformes', 1200, 'sachet · 1 kg',       'Littoral',   31, 'Moulu localement',    'photo-1627485937980-221c88ac04f9'),
  ('mais-jaune',           'Maïs jaune',           'cereales',    2500, 'sac · 5 kg',          'Ouest',      28, 'Récolte locale',      'photo-1551754655-cd27e38d2076'),
  ('haricots-rouges',      'Haricots rouges',      'cereales',    1800, 'sachet · 1 kg',       'Nord-Ouest', 24, 'Riche en protéines',  'photo-1551462147-ff29053bfc14'),
  ('riz-local',            'Riz local',            'cereales',    2200, 'sac · 2 kg',          'Centre',     19, 'Production locale',   'photo-1586201375761-83865001e31c'),
  ('ananas-frais',         'Ananas frais',         'fruits',      1000, 'pièce',               'Littoral',   15, 'Juteux et mûr',       'photo-1550258987-190a2d41a8ba'),
  ('papayes',              'Papayes',              'fruits',      1200, 'pièce',               'Centre',     11, 'Fruit de saison',     'photo-1517282009859-f000ec3b26fe'),
  ('mangues',              'Mangues',              'fruits',      1500, 'lot · 4 pièces',      'Ouest',       0, 'Bientôt disponible',  'photo-1553279768-865429fa0078'),
  ('gombo-frais',          'Gombo frais',          'maraicher',   1000, 'tas · 500 g',         'Centre',     20, 'Fraîchement cueilli', 'photo-1563565375-f3fdfdbefa83'),
  ('carottes',             'Carottes',             'maraicher',   1800, 'lot · 1 kg',          'Ouest',      17, 'Légume frais',        'photo-1445282768818-728615cc910a'),
  ('patate-douce',         'Patate douce',         'tubercules',  1600, 'lot · 2 kg',          'Littoral',   22, 'Récolte locale',      'photo-1596040033229-a9821ebd058d'),
  ('gingembre-frais',      'Gingembre frais',      'maraicher',   1300, 'tas · 500 g',         'Nord-Ouest', 13, 'Parfum intense',      'photo-1615485290382-441e4d049cb5'),
  ('miel-naturel',         'Miel naturel',         'transformes', 3500, 'bocal · 500 g',       'Ouest',       9, 'Récolte artisanale',  'photo-1587049352846-4a222e784d38'),
  ('huile-de-palme-rouge', 'Huile de palme rouge', 'transformes', 2800, 'bouteille · 1 L',     'Littoral',   12, 'Pressée localement',  'photo-1474979266404-7eaacbcd87c5')
) as v(slug, name, cat, price, unit, origin, stock, tag, img)
join c on c.slug = v.cat
on conflict (slug) do nothing;
