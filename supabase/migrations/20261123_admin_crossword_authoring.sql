-- SUSTRAI: admin-only authored crosswords. Independent from smx_crossword_daily.
create table if not exists public.smx_crossword_authoring (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  title_eu text not null check (char_length(title_eu) between 1 and 160),
  topic_code text not null check (char_length(topic_code) between 1 and 120),
  difficulty text not null default 'ertaina'
    check (difficulty in ('oinarrizkoa','ertaina','aurreratua')),
  status text not null default 'draft'
    check (status in ('draft','reviewed')),
  word_count smallint not null check (word_count between 4 and 18),
  grid_rows smallint not null check (grid_rows between 4 and 25),
  grid_cols smallint not null check (grid_cols between 4 and 25),
  entries jsonb not null check (jsonb_typeof(entries)='array'),
  source_project text not null default 'Oposik'
    check (source_project='Oposik'),
  review_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists smx_crossword_authoring_created_at_idx
  on public.smx_crossword_authoring(created_at desc);
alter table public.smx_crossword_authoring enable row level security;
revoke all on public.smx_crossword_authoring from public, anon;
grant select,insert,update,delete on public.smx_crossword_authoring to authenticated;
create policy "crossword_admin_read" on public.smx_crossword_authoring
  for select to authenticated
  using ((select public.sr_is_admin()));
create policy "crossword_admin_insert" on public.smx_crossword_authoring
  for insert to authenticated
  with check ((select public.sr_is_admin()) and created_by=(select auth.uid()));
create policy "crossword_admin_update_own" on public.smx_crossword_authoring
  for update to authenticated
  using ((select public.sr_is_admin()) and created_by=(select auth.uid()))
  with check ((select public.sr_is_admin()) and created_by=(select auth.uid()));
create policy "crossword_admin_delete_own" on public.smx_crossword_authoring
  for delete to authenticated
  using ((select public.sr_is_admin()) and created_by=(select auth.uid()));
