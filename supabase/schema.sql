create table if not exists public.workout_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.workout_state enable row level security;

revoke all on table public.workout_state from anon;
grant select, insert, update on table public.workout_state to authenticated;

drop policy if exists "Users can read their workout state" on public.workout_state;
create policy "Users can read their workout state"
on public.workout_state
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their workout state" on public.workout_state;
create policy "Users can insert their workout state"
on public.workout_state
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their workout state" on public.workout_state;
create policy "Users can update their workout state"
on public.workout_state
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop function if exists public.set_workout_state_updated_at();
create function public.set_workout_state_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workout_state_set_updated_at on public.workout_state;
create trigger workout_state_set_updated_at
before update on public.workout_state
for each row
execute function public.set_workout_state_updated_at();
