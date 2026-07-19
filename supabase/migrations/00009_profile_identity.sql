-- Allow users to update identity fields (not credits).
-- Expand GitHub OAuth name mapping for new signups.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  welcome_credits integer := 0;
  resolved_name text;
begin
  resolved_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'user_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'preferred_username'), '')
  );

  insert into public.profiles (id, email, full_name, avatar_url, credits_balance)
  values (
    new.id,
    new.email,
    resolved_name,
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

drop policy if exists "profiles_update_own_identity" on public.profiles;
create policy "profiles_update_own_identity"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
-- credits_balance remains immutable via profiles_protect_credits trigger
