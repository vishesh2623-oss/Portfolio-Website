create table if not exists public.site_stats (
  id smallint primary key check (id = 1),
  total_visits bigint not null check (total_visits >= 142)
);

insert into public.site_stats (id, total_visits)
values (1, 142)
on conflict (id) do nothing;

revoke all on table public.site_stats from anon, authenticated;

create or replace function public.increment_site_visits()
returns bigint
language sql
security definer
set search_path = ''
as $$
  update public.site_stats
  set total_visits = total_visits + 1
  where id = 1
  returning total_visits;
$$;

revoke all on function public.increment_site_visits() from public, anon, authenticated;
grant execute on function public.increment_site_visits() to anon, authenticated;
