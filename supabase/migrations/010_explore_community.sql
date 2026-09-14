-- 010_explore_community.sql
-- FASE 7: contenido real de Explore, ratings 1-5, contadores, recetas de
-- usuario con moderación, storage acotado y RLS (sin seguridad por ruta).
-- Idempotente.

-- ============================================================
-- 1. Columnas de catálogo (imagen, rating denormalizado, visibilidad)
-- ============================================================

alter table public.trends
  add column if not exists image_url text,
  add column if not exists rating_avg numeric(3,2) not null default 0,
  add column if not exists rating_count integer not null default 0,
  add column if not exists views_count integer not null default 0,
  add column if not exists show_in_see_all boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

alter table public.public_routines
  add column if not exists image_url text,
  add column if not exists badge text,
  add column if not exists route text,
  add column if not exists rating_avg numeric(3,2) not null default 0,
  add column if not exists rating_count integer not null default 0,
  add column if not exists views_count integer not null default 0,
  add column if not exists is_active boolean not null default true;

alter table public.articles
  add column if not exists image_url text,
  add column if not exists rating_avg numeric(3,2) not null default 0,
  add column if not exists rating_count integer not null default 0,
  add column if not exists views_count integer not null default 0;

alter table public.recipes_ia
  add column if not exists rating_avg numeric(3,2) not null default 0,
  add column if not exists rating_count integer not null default 0,
  add column if not exists views_count integer not null default 0,
  add column if not exists likes_count integer not null default 0,
  add column if not exists is_active boolean not null default true;

alter table public.user_recipes
  add column if not exists description text,
  add column if not exists steps text,
  add column if not exists carbs numeric(6,1),
  add column if not exists fat numeric(6,1),
  add column if not exists published_at timestamptz,
  add column if not exists moderated_at timestamptz,
  add column if not exists rating_avg numeric(3,2) not null default 0,
  add column if not exists rating_count integer not null default 0,
  add column if not exists views_count integer not null default 0,
  add column if not exists likes_count integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

alter table public.featured_content
  add column if not exists image_url text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.challenges
  add column if not exists image_url text,
  add column if not exists rating_avg numeric(3,2) not null default 0,
  add column if not exists rating_count integer not null default 0,
  add column if not exists views_count integer not null default 0,
  add column if not exists participants integer not null default 0,
  add column if not exists title text;

-- image_id se usaba como clave de asset local (texto). Si quedó integer, se promociona.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'trends'
      and column_name = 'image_id' and data_type in ('integer', 'bigint', 'numeric')
  ) then
    alter table public.trends alter column image_id type text using image_id::text;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'public_routines'
      and column_name = 'image_id' and data_type in ('integer', 'bigint', 'numeric')
  ) then
    alter table public.public_routines alter column image_id type text using image_id::text;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'articles'
      and column_name = 'image_id' and data_type in ('integer', 'bigint', 'numeric')
  ) then
    alter table public.articles alter column image_id type text using image_id::text;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'featured_content'
      and column_name = 'image_id' and data_type in ('integer', 'bigint', 'numeric')
  ) then
    alter table public.featured_content alter column image_id type text using image_id::text;
  end if;
end $$;

-- Ratings legacy > 5 (escala de 5) se recortan.
update public.trends set rating = least(rating, 5) where rating is not null and rating > 5;

alter table public.user_recipes drop constraint if exists user_recipes_status_check;
alter table public.user_recipes
  add constraint user_recipes_status_check
  check (status in ('pending', 'approved', 'rejected', 'published'));

-- Recetas antiguas publicadas sin moderación pasan a pending salvo las ya aprobadas.
-- (no tocamos approved/published existentes)

-- ============================================================
-- 2. Tablas de engagement
-- ============================================================

create table if not exists public.content_ratings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.user_profiles (id) on delete cascade,
  content_type  text not null check (content_type in (
                  'trend', 'routine', 'recipe_ia', 'user_recipe', 'article', 'challenge'
                )),
  content_id    uuid not null,
  score         integer not null check (score >= 1 and score <= 5),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, content_type, content_id)
);

create table if not exists public.content_likes (
  user_id       uuid not null references public.user_profiles (id) on delete cascade,
  content_type  text not null,
  content_id    uuid not null,
  created_at    timestamptz not null default now(),
  primary key (user_id, content_type, content_id)
);

create table if not exists public.content_favorites (
  user_id       uuid not null references public.user_profiles (id) on delete cascade,
  content_type  text not null,
  content_id    uuid not null,
  created_at    timestamptz not null default now(),
  primary key (user_id, content_type, content_id)
);

create table if not exists public.content_views (
  user_id       uuid not null references public.user_profiles (id) on delete cascade,
  content_type  text not null,
  content_id    uuid not null,
  created_at    timestamptz not null default now(),
  primary key (user_id, content_type, content_id)
);

create table if not exists public.challenge_participants (
  user_id       uuid not null references public.user_profiles (id) on delete cascade,
  challenge_id  uuid not null references public.challenges (id) on delete cascade,
  progress      numeric(4,3) not null default 0,
  joined_at     timestamptz not null default now(),
  primary key (user_id, challenge_id)
);

create index if not exists content_ratings_target_idx
  on public.content_ratings (content_type, content_id);
create index if not exists content_likes_target_idx
  on public.content_likes (content_type, content_id);
create index if not exists content_favorites_target_idx
  on public.content_favorites (content_type, content_id);
create index if not exists challenge_participants_challenge_idx
  on public.challenge_participants (challenge_id);

alter table public.content_ratings enable row level security;
alter table public.content_likes enable row level security;
alter table public.content_favorites enable row level security;
alter table public.content_views enable row level security;
alter table public.challenge_participants enable row level security;

-- ============================================================
-- 3. Helpers de agregación (SECURITY DEFINER, search_path fijo)
-- ============================================================

create or replace function public._refresh_content_rating(p_type text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_avg numeric(3,2);
  v_cnt integer;
begin
  select coalesce(avg(score), 0)::numeric(3,2), count(*)::integer
    into v_avg, v_cnt
  from public.content_ratings
  where content_type = p_type and content_id = p_id;

  if p_type = 'trend' then
    update public.trends set rating_avg = v_avg, rating_count = v_cnt, rating = v_avg where id = p_id;
  elsif p_type = 'routine' then
    update public.public_routines set rating_avg = v_avg, rating_count = v_cnt where id = p_id;
  elsif p_type = 'recipe_ia' then
    update public.recipes_ia set rating_avg = v_avg, rating_count = v_cnt where id = p_id;
  elsif p_type = 'user_recipe' then
    update public.user_recipes set rating_avg = v_avg, rating_count = v_cnt where id = p_id;
  elsif p_type = 'article' then
    update public.articles set rating_avg = v_avg, rating_count = v_cnt where id = p_id;
  elsif p_type = 'challenge' then
    update public.challenges set rating_avg = v_avg, rating_count = v_cnt where id = p_id;
  end if;
end;
$$;

create or replace function public.rate_content(p_type text, p_id uuid, p_score integer)
returns table (rating_avg numeric, rating_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'No autorizado'; end if;
  if p_score is null or p_score < 1 or p_score > 5 then
    raise exception 'La valoración debe estar entre 1 y 5';
  end if;

  insert into public.content_ratings (user_id, content_type, content_id, score)
  values (v_uid, p_type, p_id, p_score)
  on conflict (user_id, content_type, content_id)
  do update set score = excluded.score, updated_at = now();

  perform public._refresh_content_rating(p_type, p_id);

  if p_type = 'trend' then
    return query select t.rating_avg, t.rating_count from public.trends t where t.id = p_id;
  elsif p_type = 'routine' then
    return query select t.rating_avg, t.rating_count from public.public_routines t where t.id = p_id;
  elsif p_type = 'recipe_ia' then
    return query select t.rating_avg, t.rating_count from public.recipes_ia t where t.id = p_id;
  elsif p_type = 'user_recipe' then
    return query select t.rating_avg, t.rating_count from public.user_recipes t where t.id = p_id;
  elsif p_type = 'article' then
    return query select t.rating_avg, t.rating_count from public.articles t where t.id = p_id;
  else
    return query select t.rating_avg, t.rating_count from public.challenges t where t.id = p_id;
  end if;
end;
$$;

create or replace function public.record_content_view(p_type text, p_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_inserted boolean := false;
  v_count integer;
begin
  if v_uid is null then raise exception 'No autorizado'; end if;

  insert into public.content_views (user_id, content_type, content_id)
  values (v_uid, p_type, p_id)
  on conflict do nothing;
  get diagnostics v_count = row_count;
  v_inserted := v_count > 0;

  if v_inserted then
    if p_type = 'trend' then
      update public.trends set views_count = views_count + 1 where id = p_id returning views_count into v_count;
    elsif p_type = 'routine' then
      update public.public_routines set views_count = views_count + 1 where id = p_id returning views_count into v_count;
    elsif p_type = 'recipe_ia' then
      update public.recipes_ia set views_count = views_count + 1 where id = p_id returning views_count into v_count;
    elsif p_type = 'user_recipe' then
      update public.user_recipes set views_count = views_count + 1 where id = p_id returning views_count into v_count;
    elsif p_type = 'article' then
      update public.articles set views_count = views_count + 1 where id = p_id returning views_count into v_count;
    else
      update public.challenges set views_count = views_count + 1 where id = p_id returning views_count into v_count;
    end if;
  else
    if p_type = 'trend' then select views_count into v_count from public.trends where id = p_id;
    elsif p_type = 'routine' then select views_count into v_count from public.public_routines where id = p_id;
    elsif p_type = 'recipe_ia' then select views_count into v_count from public.recipes_ia where id = p_id;
    elsif p_type = 'user_recipe' then select views_count into v_count from public.user_recipes where id = p_id;
    elsif p_type = 'article' then select views_count into v_count from public.articles where id = p_id;
    else select views_count into v_count from public.challenges where id = p_id;
    end if;
  end if;

  return coalesce(v_count, 0);
end;
$$;

create or replace function public.toggle_content_like(p_type text, p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_exists boolean;
begin
  if v_uid is null then raise exception 'No autorizado'; end if;

  select exists (
    select 1 from public.content_likes
    where user_id = v_uid and content_type = p_type and content_id = p_id
  ) into v_exists;

  if v_exists then
    delete from public.content_likes
    where user_id = v_uid and content_type = p_type and content_id = p_id;
    if p_type = 'recipe_ia' then
      update public.recipes_ia set likes_count = greatest(likes_count - 1, 0) where id = p_id;
    elsif p_type = 'user_recipe' then
      update public.user_recipes set likes_count = greatest(likes_count - 1, 0) where id = p_id;
    end if;
    return false;
  else
    insert into public.content_likes (user_id, content_type, content_id)
    values (v_uid, p_type, p_id);
    if p_type = 'recipe_ia' then
      update public.recipes_ia set likes_count = likes_count + 1 where id = p_id;
    elsif p_type = 'user_recipe' then
      update public.user_recipes set likes_count = likes_count + 1 where id = p_id;
    end if;
    return true;
  end if;
end;
$$;

create or replace function public.toggle_content_favorite(p_type text, p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_exists boolean;
begin
  if v_uid is null then raise exception 'No autorizado'; end if;

  select exists (
    select 1 from public.content_favorites
    where user_id = v_uid and content_type = p_type and content_id = p_id
  ) into v_exists;

  if v_exists then
    delete from public.content_favorites
    where user_id = v_uid and content_type = p_type and content_id = p_id;
    return false;
  end if;

  insert into public.content_favorites (user_id, content_type, content_id)
  values (v_uid, p_type, p_id);
  return true;
end;
$$;

create or replace function public.join_challenge(p_challenge_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null then raise exception 'No autorizado'; end if;

  insert into public.challenge_participants (user_id, challenge_id)
  values (v_uid, p_challenge_id)
  on conflict do nothing;

  select count(*)::integer into v_count
  from public.challenge_participants
  where challenge_id = p_challenge_id;

  update public.challenges set participants = v_count where id = p_challenge_id;
  update public.featured_content
     set participants = v_count
   where target_id = p_challenge_id::text;

  return v_count;
end;
$$;

create or replace function public.assert_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin();
$$;

create or replace function public.moderate_user_recipe(p_id uuid, p_status text)
returns public.user_recipes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.user_recipes;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;
  if p_status not in ('pending', 'approved', 'rejected', 'published') then
    raise exception 'Estado inválido';
  end if;

  update public.user_recipes
     set status = p_status,
         moderated_at = now(),
         published_at = case when p_status = 'published' then now() else published_at end,
         updated_at = now()
   where id = p_id
   returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public._refresh_content_rating(text, uuid) from public, anon, authenticated;
grant execute on function public.rate_content(text, uuid, integer) to authenticated;
grant execute on function public.record_content_view(text, uuid) to authenticated;
grant execute on function public.toggle_content_like(text, uuid) to authenticated;
grant execute on function public.toggle_content_favorite(text, uuid) to authenticated;
grant execute on function public.join_challenge(uuid) to authenticated;
grant execute on function public.assert_admin() to authenticated, anon;
grant execute on function public.moderate_user_recipe(uuid, text) to authenticated;

-- ============================================================
-- 4. RLS engagement
-- ============================================================

drop policy if exists "Users manage own ratings" on public.content_ratings;
create policy "Users manage own ratings" on public.content_ratings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users read ratings" on public.content_ratings;
create policy "Users read ratings" on public.content_ratings
  for select using (auth.role() = 'authenticated');

drop policy if exists "Users manage own likes" on public.content_likes;
create policy "Users manage own likes" on public.content_likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own favorites" on public.content_favorites;
create policy "Users manage own favorites" on public.content_favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own views" on public.content_views;
create policy "Users manage own views" on public.content_views
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own challenge participation" on public.challenge_participants;
create policy "Users manage own challenge participation" on public.challenge_participants
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users read challenge participation counts" on public.challenge_participants;
create policy "Users read challenge participation counts" on public.challenge_participants
  for select using (auth.role() = 'authenticated');
drop policy if exists "Admins manage challenge participation" on public.challenge_participants;
create policy "Admins manage challenge participation" on public.challenge_participants
  for all using (is_admin()) with check (is_admin());

-- Recetas: el propietario no puede auto-aprobar. Solo pending/rejected en INSERT/UPDATE propio.
drop policy if exists "Users can manage their own recipes" on public.user_recipes;
create policy "Users can insert own recipes pending" on public.user_recipes
  for insert with check (
    auth.uid() = user_id and status in ('pending')
  );
create policy "Users can update own recipes while unpublished" on public.user_recipes
  for update using (
    auth.uid() = user_id and status in ('pending', 'rejected')
  ) with check (
    auth.uid() = user_id and status in ('pending', 'rejected')
  );
create policy "Users can delete own unpublished recipes" on public.user_recipes
  for delete using (
    auth.uid() = user_id and status in ('pending', 'rejected')
  );
drop policy if exists "Anyone can read approved recipes" on public.user_recipes;
create policy "Anyone can read published recipes" on public.user_recipes
  for select using (
    status in ('approved', 'published')
    or auth.uid() = user_id
    or is_admin()
  );

grant select, insert, update, delete on public.content_ratings to authenticated;
grant select, insert, update, delete on public.content_likes to authenticated;
grant select, insert, update, delete on public.content_favorites to authenticated;
grant select, insert, update, delete on public.content_views to authenticated;
grant select, insert, update, delete on public.challenge_participants to authenticated;

-- ============================================================
-- 5. Storage: MIME, tamaño, nombres únicos, dueño o admin
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mygymcoach-images',
  'mygymcoach-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Authenticated users can read mygymcoach images" on storage.objects;
create policy "Public can read mygymcoach images"
  on storage.objects for select
  using (bucket_id = 'mygymcoach-images');

drop policy if exists "Admins can upload mygymcoach images" on storage.objects;
create policy "Users upload own folder or admin"
  on storage.objects for insert
  with check (
    bucket_id = 'mygymcoach-images'
    and auth.role() = 'authenticated'
    and (
      is_admin()
      or (storage.foldername(name))[1] = 'users'
         and (storage.foldername(name))[2] = auth.uid()::text
    )
  );

drop policy if exists "Admins can update mygymcoach images" on storage.objects;
create policy "Users update own folder or admin"
  on storage.objects for update
  using (
    bucket_id = 'mygymcoach-images'
    and (
      is_admin()
      or (storage.foldername(name))[1] = 'users'
         and (storage.foldername(name))[2] = auth.uid()::text
    )
  );

drop policy if exists "Admins can delete mygymcoach images" on storage.objects;
create policy "Users delete own folder or admin"
  on storage.objects for delete
  using (
    bucket_id = 'mygymcoach-images'
    and (
      is_admin()
      or (storage.foldername(name))[1] = 'users'
         and (storage.foldername(name))[2] = auth.uid()::text
    )
  );
