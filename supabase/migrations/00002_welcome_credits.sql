-- Interim testing: grant welcome credits to new users so the workspace is reachable
-- before Stripe checkout is wired.

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
