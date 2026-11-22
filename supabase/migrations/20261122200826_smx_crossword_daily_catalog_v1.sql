-- SUSTRAI · Gurutzegramak · diario
-- Migración aplicada en Supabase Lexikoa, versión 20261122200826.
-- No almacena progreso privado ni autoriza escrituras desde el navegador.
create table if not exists public.smx_crossword_daily (
  id text primary key,
  play_date date not null,
  mode text not null check (mode in ('ikasi','erronka')),
  level text not null default 'C1' check (level in ('B2','C1','C2')),
  title_eu text not null,
  theme_eu text not null,
  grid_rows smallint not null check (grid_rows between 5 and 21),
  grid_cols smallint not null check (grid_cols between 5 and 21),
  entries jsonb not null check (jsonb_typeof(entries) = 'array' and jsonb_array_length(entries) between 6 and 18),
  status text not null default 'draft' check (status in ('draft','pilot','published','archived')),
  review_status text not null default 'pending' check (review_status in ('pending','reviewed','rejected')),
  source_note text not null,
  created_at timestamptz not null default now(),
  unique(play_date,mode,level)
);
alter table public.smx_crossword_daily enable row level security;
revoke all on public.smx_crossword_daily from anon, authenticated;
grant select on public.smx_crossword_daily to anon, authenticated;
drop policy if exists smx_crossword_daily_read_current_and_past on public.smx_crossword_daily;
create policy smx_crossword_daily_read_current_and_past on public.smx_crossword_daily
for select to anon, authenticated
using (
 status in ('pilot','published')
 and play_date <= (now() at time zone 'Europe/Madrid')::date
);
comment on table public.smx_crossword_daily is
'SUSTRAI daily Basque health crosswords; future answers hidden by RLS until Euskadi-local play date. Pilot content is not independently certified.';
