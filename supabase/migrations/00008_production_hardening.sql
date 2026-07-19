-- Production hardening:
-- 1. Welcome credits = 0 (paywall-first signup)
-- 2. Block client updates to credits_balance on profiles
-- 3. Atomic Lemon order fulfillment (idempotent credit grants)
-- 4. Row lock in grant_credits for concurrent deductions

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  welcome_credits integer := 0;
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

-- Prevent authenticated clients from minting credits via profiles.update
create or replace function public.protect_profile_credits()
returns trigger
language plpgsql
as $$
begin
  if new.credits_balance is distinct from old.credits_balance
     and coalesce(current_setting('app.allow_credit_mutation', true), '') <> 'on'
  then
    raise exception 'credits_balance is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_credits on public.profiles;
create trigger profiles_protect_credits
  before update on public.profiles
  for each row
  execute function public.protect_profile_credits();

-- Profiles are select-only for authenticated users (no self-update of credits)
drop policy if exists "profiles_update_own" on public.profiles;

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

  perform set_config('app.allow_credit_mutation', 'on', true);

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
  to service_role, postgres;

-- Idempotent Lemon fulfillment under a single row lock
create or replace function public.fulfill_lemon_order(
  p_order_id text,
  p_user_id uuid,
  p_amount_cents integer,
  p_currency text,
  p_credits integer,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment_id uuid;
  v_status public.payment_status;
  v_balance integer;
begin
  if p_credits <= 0 then
    raise exception 'credits must be positive';
  end if;

  insert into public.payments (
    user_id,
    provider,
    provider_payment_id,
    amount_cents,
    currency,
    status,
    credits_granted,
    metadata
  )
  values (
    p_user_id,
    'lemon_squeezy',
    p_order_id,
    p_amount_cents,
    lower(p_currency),
    'pending',
    0,
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (provider, provider_payment_id) do nothing;

  select id, status
  into v_payment_id, v_status
  from public.payments
  where provider = 'lemon_squeezy'
    and provider_payment_id = p_order_id
  for update;

  if v_payment_id is null then
    raise exception 'payment not found';
  end if;

  if v_status = 'succeeded' then
    return jsonb_build_object('ok', true, 'duplicate', true, 'payment_id', v_payment_id);
  end if;

  v_balance := public.grant_credits(
    p_user_id,
    p_credits,
    'purchase',
    v_payment_id,
    jsonb_build_object(
      'source', 'lemon_squeezy',
      'order_id', p_order_id
    )
  );

  update public.payments
  set
    status = 'succeeded',
    credits_granted = p_credits,
    amount_cents = p_amount_cents,
    currency = lower(p_currency),
    metadata = coalesce(metadata, '{}'::jsonb) || coalesce(p_metadata, '{}'::jsonb)
  where id = v_payment_id;

  return jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'payment_id', v_payment_id,
    'credits', p_credits,
    'balance', v_balance
  );
end;
$$;

revoke all on function public.fulfill_lemon_order(text, uuid, integer, text, integer, jsonb)
  from public, anon, authenticated;
grant execute on function public.fulfill_lemon_order(text, uuid, integer, text, integer, jsonb)
  to service_role;
