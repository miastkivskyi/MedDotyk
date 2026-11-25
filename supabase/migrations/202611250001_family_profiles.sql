-- Private cloud storage for family profiles created from the Telegram Mini App.
-- Writes are performed only by the family-profiles Edge Function using service_role.
create table if not exists public.telegram_family_profiles (
  id uuid not null,
  telegram_user_id bigint not null,
  profile_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (telegram_user_id, id)
);

alter table public.telegram_family_profiles enable row level security;

-- No direct browser access. The Edge Function uses the server-side service role.
revoke all on table public.telegram_family_profiles from anon, authenticated;
grant all on table public.telegram_family_profiles to service_role;

create index if not exists telegram_family_profiles_owner_idx
  on public.telegram_family_profiles (telegram_user_id, created_at);
