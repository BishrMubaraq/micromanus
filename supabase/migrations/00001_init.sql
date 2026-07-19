-- MicroManus initial schema
-- profiles, api_keys, payments, credits, chats, messages, usage_logs, reports

create extension if not exists "pgcrypto";

-- Enums
create type public.chat_status as enum ('active', 'archived', 'deleted');
create type public.message_role as enum ('user', 'assistant', 'system', 'tool');
create type public.payment_status as enum (
  'pending',
  'succeeded',
  'failed',
  'refunded',
  'canceled'
);
create type public.credit_reason as enum (
  'purchase',
  'grant',
  'usage',
  'refund',
  'adjustment'
);

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  credits_balance integer not null default 0 check (credits_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_credits_balance_idx on public.profiles (credits_balance);

-- API keys (hashed secrets only)
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index api_keys_user_id_idx on public.api_keys (user_id);
create index api_keys_user_id_active_idx
  on public.api_keys (user_id)
  where revoked_at is null;

-- Payments (Stripe-ready)
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null default 'stripe',
  provider_payment_id text not null,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd',
  status public.payment_status not null default 'pending',
  credits_granted integer not null default 0 check (credits_granted >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_payment_id)
);

create index payments_user_id_idx on public.payments (user_id);
create index payments_user_id_created_at_idx
  on public.payments (user_id, created_at desc);
create index payments_provider_payment_id_idx
  on public.payments (provider_payment_id);

-- Credits ledger (append-only)
create table public.credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta integer not null,
  reason public.credit_reason not null,
  payment_id uuid references public.payments (id) on delete set null,
  balance_after integer not null check (balance_after >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index credits_user_id_created_at_idx
  on public.credits (user_id, created_at desc);
create index credits_payment_id_idx on public.credits (payment_id);

-- Chats
create table public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Untitled research',
  status public.chat_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index chats_user_id_idx on public.chats (user_id);
create index chats_user_id_updated_at_idx
  on public.chats (user_id, updated_at desc);
create index chats_user_id_status_idx on public.chats (user_id, status);

-- Messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.message_role not null,
  content text not null default '',
  parts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index messages_chat_id_created_at_idx
  on public.messages (chat_id, created_at);
create index messages_user_id_idx on public.messages (user_id);

-- Usage logs
create table public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  chat_id uuid references public.chats (id) on delete set null,
  model text not null,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  credits_spent integer not null default 0 check (credits_spent >= 0),
  cost_cents integer check (cost_cents is null or cost_cents >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index usage_logs_user_id_created_at_idx
  on public.usage_logs (user_id, created_at desc);
create index usage_logs_chat_id_idx on public.usage_logs (chat_id);

-- Reports
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  chat_id uuid not null references public.chats (id) on delete cascade,
  title text not null,
  content text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reports_user_id_idx on public.reports (user_id);
create index reports_chat_id_idx on public.reports (chat_id);
create index reports_user_id_created_at_idx
  on public.reports (user_id, created_at desc);

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

create trigger chats_set_updated_at
  before update on public.chats
  for each row execute function public.set_updated_at();

create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

-- Bootstrap profile on signup with interim welcome credits (Stripe later)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  welcome_credits integer := 100;
begin
  insert into public.profiles (id, email, full_name, avatar_url, credits_balance)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.raw_user_meta_data ->> 'avatar_url',
    welcome_credits
  );

  if welcome_credits > 0 then
    insert into public.credits (user_id, delta, reason, balance_after, metadata)
    values (
      new.id,
      welcome_credits,
      'grant',
      welcome_credits,
      jsonb_build_object('source', 'welcome_credits')
    );
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Credit grant (service role / security definer only)
create or replace function public.grant_credits(
  p_user_id uuid,
  p_delta integer,
  p_reason public.credit_reason,
  p_payment_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  if p_delta = 0 then
    raise exception 'delta must be non-zero';
  end if;

  update public.profiles
  set credits_balance = credits_balance + p_delta
  where id = p_user_id
  returning credits_balance into v_balance;

  if not found then
    raise exception 'profile not found';
  end if;

  if v_balance < 0 then
    raise exception 'insufficient credits';
  end if;

  insert into public.credits (
    user_id,
    delta,
    reason,
    payment_id,
    balance_after,
    metadata
  )
  values (
    p_user_id,
    p_delta,
    p_reason,
    p_payment_id,
    v_balance,
    coalesce(p_metadata, '{}'::jsonb)
  );

  return v_balance;
end;
$$;

revoke all on function public.grant_credits(uuid, integer, public.credit_reason, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.grant_credits(uuid, integer, public.credit_reason, uuid, jsonb)
  to service_role;

-- RLS
alter table public.profiles enable row level security;
alter table public.api_keys enable row level security;
alter table public.payments enable row level security;
alter table public.credits enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.usage_logs enable row level security;
alter table public.reports enable row level security;

-- Profiles
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- API keys
create policy "api_keys_select_own"
  on public.api_keys for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "api_keys_insert_own"
  on public.api_keys for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "api_keys_update_own"
  on public.api_keys for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "api_keys_delete_own"
  on public.api_keys for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Payments: users can read own rows; writes via service role only
create policy "payments_select_own"
  on public.payments for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Credits: users can read own ledger; writes via grant_credits / service role
create policy "credits_select_own"
  on public.credits for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Chats
create policy "chats_select_own"
  on public.chats for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "chats_insert_own"
  on public.chats for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "chats_update_own"
  on public.chats for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "chats_delete_own"
  on public.chats for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Messages
create policy "messages_select_own"
  on public.messages for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "messages_insert_own"
  on public.messages for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "messages_update_own"
  on public.messages for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "messages_delete_own"
  on public.messages for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Usage logs: read own; inserts via service role
create policy "usage_logs_select_own"
  on public.usage_logs for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Reports
create policy "reports_select_own"
  on public.reports for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "reports_insert_own"
  on public.reports for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "reports_update_own"
  on public.reports for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "reports_delete_own"
  on public.reports for delete
  to authenticated
  using (user_id = (select auth.uid()));
