-- 009_nutrition_f5.sql
-- FASE 5: sistema nutricional completo.
-- Objetivo: reconciliar el esquema de nutrición con el contrato que usa el
-- cliente (columns food_name / quantity_g / fuentes del catálogo) de forma
-- 100% idempotente y aditiva (nunca borra ni altera columnas existentes).
-- Seguro en: bases nuevas (db reset), locales y el remoto (que arrastra drift).

-- Helper: nombre normalizado (minúsculas + sin acentos) para búsqueda y dedupe.
create or replace function public.food_search_name(p_name text)
returns text
language sql
immutable
as $$
    select lower(translate(coalesce(p_name, ''), 'áéíóúÁÉÍÓÚüÜñ', 'aeiouAEIOUuUn'));
$$;

-- ══════════════════════════════════════════════════════════════════════════
-- 1. CATÁLOGO DE ALIMENTOS: columnas usadas por foodService / creación de
--    alimentos y por la búsqueda híbrida (OFF → local).
-- ══════════════════════════════════════════════════════════════════════════
alter table public.foods add column if not exists search_name text;
alter table public.foods add column if not exists category     text not null default 'otros';
alter table public.foods add column if not exists source       text not null default 'database';
alter table public.foods add column if not exists is_verified  boolean not null default true;
alter table public.foods add column if not exists created_by   uuid references public.user_profiles (id) on delete set null;
alter table public.foods add column if not exists last_used    timestamptz;

comment on column public.foods.search_name is
  'Nombre normalizado (minúsculas, sin acentos) para búsqueda ilike (FASE 5)';
comment on column public.foods.source is
  'Origen: database | user | openfoodfacts (FASE 5)';
comment on column public.foods.category is
  'Categoría del alimento para segmentación en la búsqueda (FASE 5)';

-- Rellenar search_name de filas históricas que no lo tengan.
update public.foods
set search_name = public.food_search_name(name)
where search_name is null;

create index if not exists foods_search_name_idx on public.foods (search_name);
create index if not exists foods_source_idx on public.foods (source);

-- ══════════════════════════════════════════════════════════════════════════
-- 2. nutrition_logs: columnas del contrato del cliente (drift vs 006).
-- ══════════════════════════════════════════════════════════════════════════
alter table public.nutrition_logs add column if not exists food_name text;
alter table public.nutrition_logs add column if not exists quantity_g numeric(10,2);
alter table public.nutrition_logs add column if not exists barcode    text;

comment on column public.nutrition_logs.food_name is
  'Nombre visual del alimento registrado (FASE 5)';
comment on column public.nutrition_logs.quantity_g is
  'Cantidad en gramos registrada (FASE 5)';

-- Índice de apoyo para el historial día/semana/mes.
create index if not exists nutrition_logs_date_meal_idx
  on public.nutrition_logs (logged_date, meal_type);

-- ══════════════════════════════════════════════════════════════════════════
-- 3. recent_foods: food_id es opcional (productos OFF aún no guardados) y el
--    cliente persiste food_name para mostrarlo sin JOINs.
-- ══════════════════════════════════════════════════════════════════════════
alter table public.recent_foods add column if not exists food_name text;
alter table public.recent_foods add column if not exists created_at timestamptz not null default now();
alter table public.recent_foods alter column food_id drop not null;

comment on column public.recent_foods.food_name is 'Nombre del alimento reciente (FASE 5)';

-- ══════════════════════════════════════════════════════════════════════════
-- 4. food_favorites: snapshot nutricional para mostrar el favorito sin JOIN.
-- ══════════════════════════════════════════════════════════════════════════
alter table public.food_favorites add column if not exists food_name text;
alter table public.food_favorites add column if not exists calories  numeric(7,1) not null default 0;
alter table public.food_favorites add column if not exists protein_g numeric(6,1) not null default 0;
alter table public.food_favorites add column if not exists carbs_g   numeric(6,1) not null default 0;
alter table public.food_favorites add column if not exists fat_g     numeric(6,1) not null default 0;
alter table public.food_favorites add column if not exists created_at timestamptz not null default now();
alter table public.food_favorites alter column food_id drop not null;

-- ══════════════════════════════════════════════════════════════════════════
-- 5. meal_plans: contrato del cliente (semana + día + comida + snapshot).
-- ══════════════════════════════════════════════════════════════════════════
alter table public.meal_plans add column if not exists week_start   date;
alter table public.meal_plans add column if not exists day_of_week  integer;
alter table public.meal_plans add column if not exists meal_type    text;
alter table public.meal_plans add column if not exists food_name    text;
alter table public.meal_plans add column if not exists food_id      text;
alter table public.meal_plans add column if not exists calories     numeric(7,1) not null default 0;
alter table public.meal_plans add column if not exists protein_g    numeric(6,1) not null default 0;
alter table public.meal_plans add column if not exists carbs_g      numeric(6,1) not null default 0;
alter table public.meal_plans add column if not exists fat_g        numeric(6,1) not null default 0;
alter table public.meal_plans add column if not exists quantity_g   numeric(10,2);

create index if not exists meal_plans_user_week_idx
  on public.meal_plans (user_id, week_start, day_of_week);

-- ══════════════════════════════════════════════════════════════════════════
-- 6. CATÁLOGO INICIAL: alimentos comunes (per100g) para búsqueda offline.
--    Idempotente: inserta solo los que no existan por nombre normalizado.
-- ══════════════════════════════════════════════════════════════════════════
do $$
declare
    v_name text;
begin
    create temporary table if not exists tmp_food_seed (
        seed_name text, seed_cat text, seed_cal numeric, seed_p numeric,
        seed_c numeric, seed_f numeric
    ) on commit drop;
    truncate tmp_food_seed;

    insert into tmp_food_seed (seed_name, seed_cat, seed_cal, seed_p, seed_c, seed_f) values
    ('Arroz blanco cocido',          'cereales',   130, 2.7, 28.0, 0.3),
    ('Arroz integral cocido',        'cereales',   112, 2.6, 24.0, 0.9),
    ('Pechuga de pollo a la plancha','carnes',     165, 31.0, 0.0, 3.6),
    ('Huevo entero',                 'lacteos',    155, 13.0, 1.1, 11.0),
    ('Clara de huevo',               'lacteos',     52, 11.0, 0.7, 0.2),
    ('Atún en lata al natural',      'pescados',   116, 26.0, 0.0, 0.8),
    ('Salmón a la plancha',          'pescados',   208, 20.0, 0.0, 13.0),
    ('Pavo filete',                  'carnes',     135, 29.0, 0.0, 1.5),
    ('Carne picada de ternera magra','carnes',     215, 23.0, 0.0, 13.0),
    ('Lomo de cerdo',                'carnes',     165, 27.0, 0.0, 6.0),
    ('Gamba',                        'pescados',    99, 24.0, 0.2, 0.3),
    ('Merluza',                      'pescados',    85, 18.0, 0.0, 1.0),
    ('Leche desnatada',              'lacteos',     34, 3.4, 5.0, 0.1),
    ('Leche entera',                 'lacteos',     61, 3.2, 4.8, 3.3),
    ('Yogur natural desnatado',      'lacteos',     56, 10.0, 3.6, 0.2),
    ('Yogur griego natural',         'lacteos',     97, 9.0, 3.9, 5.0),
    ('Requesón',                     'lacteos',     98, 11.1, 3.4, 4.3),
    ('Queso fresco',                 'lacteos',     72, 11.0, 2.0, 2.2),
    ('Avena integral',               'cereales',   389, 16.9, 66.0, 6.9),
    ('Pan integral',                 'cereales',   247, 13.0, 41.0, 3.4),
    ('Pan blanco',                   'cereales',   265, 9.0, 49.0, 3.2),
    ('Pasta cocida',                 'cereales',   131, 5.0, 25.0, 1.1),
    ('Patata cocida',                'verduras',    77, 2.0, 17.0, 0.1),
    ('Boniato cocido',               'verduras',    86, 1.6, 20.0, 0.1),
    ('Plátano',                      'frutas',      89, 1.1, 22.8, 0.3),
    ('Manzana',                      'frutas',      52, 0.3, 14.0, 0.2),
    ('Naranja',                      'frutas',      47, 0.9, 12.0, 0.1),
    ('Fresas',                       'frutas',      32, 0.7, 7.7, 0.3),
    ('Uvas',                         'frutas',      69, 0.7, 18.0, 0.2),
    ('Kiwi',                         'frutas',      61, 1.1, 15.0, 0.5),
    ('Aguacate',                     'frutas',     160, 2.0, 8.5, 14.7),
    ('Tomate',                       'verduras',    18, 0.9, 3.9, 0.2),
    ('Brócoli',                      'verduras',    34, 2.8, 6.6, 0.4),
    ('Espinacas',                    'verduras',    23, 2.9, 3.6, 0.4),
    ('Zanahoria',                    'verduras',    41, 0.9, 9.6, 0.2),
    ('Garbanzos cocidos',            'legumbres',   164, 8.9, 27.4, 2.6),
    ('Lentejas cocidas',             'legumbres',   116, 9.0, 20.0, 0.4),
    ('Alubias negras cocidas',       'legumbres',   132, 8.9, 23.7, 0.5),
    ('Almendras',                    'grasas',      579, 21.2, 21.6, 49.9),
    ('Nueces',                       'grasas',      654, 15.2, 13.7, 65.2),
    ('Cacahuetes',                   'snacks',      567, 25.8, 16.1, 49.2),
    ('Mantequilla de cacahuete',     'snacks',      588, 25.0, 20.0, 50.0),
    ('Aceite de oliva',              'grasas',      884, 0.0, 0.0, 100.0),
    ('Quinoa cocida',                'cereales',   120, 4.4, 21.3, 1.9),
    ('Tofu firme',                   'legumbres',   76, 8.0, 1.9, 4.8),
    ('Batido de proteína (scoop 30g)','suplementos',120, 24.0, 3.0, 1.5),
    ('Café con leche desnatada',     'bebidas',     42, 3.0, 4.0, 1.0),
    ('Chocolate negro 85%',          'snacks',      598, 7.9, 45.9, 42.6),
    ('Miel',                         'otros',       304, 0.3, 82.4, 0.0);

    for v_name in
        select seed_name from tmp_food_seed order by seed_name
    loop
        insert into public.foods (
            food_id, name, barcode, brand, serving_size,
            calories, protein_g, carbs_g, fat_g, usage_count,
            search_name, category, source, is_verified
        )
        select
            gen_random_uuid(), t.seed_name, null, '', 100,
            t.seed_cal, t.seed_p, t.seed_c, t.seed_f, 0,
            public.food_search_name(t.seed_name),
            t.seed_cat, 'database', true
        from tmp_food_seed t
        where t.seed_name = v_name
          and not exists (
              select 1 from public.foods f
              where public.food_search_name(f.name)
                  = public.food_search_name(t.seed_name)
          );
    end loop;
end $$;

-- Acceso público al helper (catálogo compartido; no expone datos personales).
revoke all on function public.food_search_name(text) from public;
grant execute on function public.food_search_name(text) to authenticated;
grant execute on function public.food_search_name(text) to service_role;