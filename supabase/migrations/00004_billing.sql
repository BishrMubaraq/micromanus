-- Billing: coupons + Lemon Squeezy payment history support

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  credits integer not null check (credits > 0),
  max_redemptions_per_user integer not null default 1 check (max_redemptions_per_user > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  credits_granted integer not null check (credits_granted > 0),
  created_at timestamptz not null default now(),
  unique (coupon_id, user_id)
);

create index coupon_redemptions_user_id_idx
  on public.coupon_redemptions (user_id);

alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;

-- Coupons are not publicly readable; redemption goes through a security-definer RPC.
create policy "coupon_redemptions_select_own"
  on public.coupon_redemptions for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Seed launch coupon: SID_DRDROID → 5 credits, once per user
insert into public.coupons (code, credits, max_redemptions_per_user, is_active)
values ('SID_DRDROID', 5, 1, true)
on conflict (code) do update
set credits = excluded.credits,
    max_redemptions_per_user = excluded.max_redemptions_per_user,
    is_active = excluded.is_active;

-- Atomic coupon redeem
create or replace function public.redeem_coupon(
  p_user_id uuid,
  p_code text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon public.coupons%rowtype;
  v_balance integer;
begin
  if p_user_id is distinct from auth.uid() then
    raise exception 'forbidden';
  end if;

  select *
  into v_coupon
  from public.coupons
  where upper(code) = upper(trim(p_code))
    and is_active = true
  for update;

  if not found then
    raise exception 'invalid_coupon';
  end if;

  if exists (
    select 1
    from public.coupon_redemptions
    where coupon_id = v_coupon.id
      and user_id = p_user_id
  ) then
    raise exception 'already_redeemed';
  end if;

  insert into public.coupon_redemptions (coupon_id, user_id, credits_granted)
  values (v_coupon.id, p_user_id, v_coupon.credits);

  v_balance := public.grant_credits(
    p_user_id,
    v_coupon.credits,
    'grant',
    null,
    jsonb_build_object('source', 'coupon', 'code', v_coupon.code)
  );

  return v_balance;
end;
$$;

-- Allow nested grant_credits call from this security-definer function
grant execute on function public.grant_credits(uuid, integer, public.credit_reason, uuid, jsonb)
  to postgres, service_role;

revoke all on function public.redeem_coupon(uuid, text) from public, anon;
grant execute on function public.redeem_coupon(uuid, text) to authenticated;

-- Payments: ensure provider defaults support lemon_squeezy
alter table public.payments
  alter column provider set default 'lemon_squeezy';
