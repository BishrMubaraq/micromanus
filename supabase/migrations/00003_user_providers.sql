-- User-supplied LLM provider credentials (API keys encrypted at rest)

create type public.llm_provider as enum ('openai', 'anthropic', 'kimi');

create table public.user_providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider public.llm_provider not null,
  endpoint text not null,
  api_key_ciphertext text not null,
  api_key_iv text not null,
  api_key_tag text not null,
  api_key_last_four text not null default '',
  default_model text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index user_providers_user_id_idx on public.user_providers (user_id);
create index user_providers_provider_idx on public.user_providers (provider);

create trigger user_providers_set_updated_at
  before update on public.user_providers
  for each row execute function public.set_updated_at();

alter table public.user_providers enable row level security;

create policy "user_providers_select_own"
  on public.user_providers for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "user_providers_insert_own"
  on public.user_providers for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "user_providers_update_own"
  on public.user_providers for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "user_providers_delete_own"
  on public.user_providers for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Token usage fields
alter table public.usage_logs
  add column if not exists cache_tokens integer not null default 0
    check (cache_tokens >= 0);

alter table public.usage_logs
  add column if not exists total_tokens integer not null default 0
    check (total_tokens >= 0);

alter table public.usage_logs
  add column if not exists provider text;

update public.usage_logs
set total_tokens = coalesce(input_tokens, 0) + coalesce(output_tokens, 0)
where total_tokens = 0
  and (input_tokens > 0 or output_tokens > 0);
