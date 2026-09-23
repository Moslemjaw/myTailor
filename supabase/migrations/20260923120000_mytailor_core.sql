-- =============================================================================
-- MyTailor — core schema, row level security and marketplace operations
--
-- Principle: the UI controls what users normally do; this file controls what
-- users are actually allowed to do. Every table has RLS enabled, direct writes
-- are revoked wherever a rule spans several rows, and the marketplace state
-- machine (offers → acceptance → order → progress → review) only moves through
-- SECURITY DEFINER functions that validate the caller and lock the rows they
-- touch.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Types
-- -----------------------------------------------------------------------------
create type public.user_role      as enum ('customer', 'tailor');
create type public.request_status as enum ('open', 'closed');
create type public.offer_status   as enum ('pending', 'accepted', 'declined', 'closed');
create type public.order_status   as enum ('accepted', 'in_progress', 'ready', 'completed');

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  role             public.user_role not null,
  full_name        text not null check (char_length(btrim(full_name)) between 1 and 80),
  city             text check (city is null or char_length(city) <= 80),
  bio              text check (bio is null or char_length(bio) <= 600),
  specialties      text[] not null default '{}' check (cardinality(specialties) <= 12),
  years_experience integer check (years_experience is null or years_experience between 0 and 80),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.requests (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title        text not null check (char_length(btrim(title)) between 3 and 120),
  description  text not null check (char_length(btrim(description)) between 10 and 4000),
  garment_type text not null check (garment_type in
                 ('suit', 'dress', 'shirt', 'trousers', 'traditional', 'outerwear', 'alteration', 'other')),
  desired_date date not null,
  image_path   text check (image_path is null or image_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]{1,120}$'),
  ai_assisted  boolean not null default false,
  status       public.request_status not null default 'open',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  closed_at    timestamptz
);

create table public.offers (
  id              uuid primary key default gen_random_uuid(),
  request_id      uuid not null references public.requests (id) on delete cascade,
  tailor_id       uuid not null references public.profiles (id) on delete cascade,
  price           numeric(10, 3) not null check (price > 0 and price <= 100000),
  turnaround_days integer not null check (turnaround_days between 1 and 365),
  message         text not null check (char_length(btrim(message)) between 1 and 1500),
  status          public.offer_status not null default 'pending',
  revision        integer not null default 1,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  decided_at      timestamptz,
  unique (request_id, tailor_id)
);

-- Append-only history of every version of an offer (SRS §9, §34).
create table public.offer_revisions (
  id              uuid primary key default gen_random_uuid(),
  offer_id        uuid not null references public.offers (id) on delete cascade,
  revision        integer not null,
  price           numeric(10, 3) not null,
  turnaround_days integer not null,
  message         text not null,
  created_at      timestamptz not null default now(),
  unique (offer_id, revision)
);

create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    bigint generated always as identity (start with 1001) unique,
  request_id      uuid not null unique references public.requests (id),
  offer_id        uuid not null unique references public.offers (id),
  customer_id     uuid not null references public.profiles (id),
  tailor_id       uuid not null references public.profiles (id),
  price           numeric(10, 3) not null,
  turnaround_days integer not null,
  status          public.order_status not null default 'accepted',
  created_at      timestamptz not null default now(),
  started_at      timestamptz,
  ready_at        timestamptz,
  completed_at    timestamptz,
  updated_at      timestamptz not null default now(),
  check (customer_id <> tailor_id)
);

-- Audit trail of status changes (SRS §34).
create table public.order_events (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status   public.order_status not null,
  actor_id    uuid references public.profiles (id),
  created_at  timestamptz not null default now()
);

create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders (id) on delete cascade,
  sender_id  uuid not null default auth.uid() references public.profiles (id),
  body       text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null unique references public.orders (id),
  customer_id uuid not null references public.profiles (id),
  tailor_id   uuid not null references public.profiles (id),
  rating      smallint not null check (rating between 1 and 5),
  comment     text check (comment is null or char_length(comment) <= 1500),
  created_at  timestamptz not null default now()
);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  kind       text not null,
  title      text not null,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index requests_status_created_idx on public.requests (status, created_at desc);
create index requests_customer_idx       on public.requests (customer_id, created_at desc);
create index offers_request_idx          on public.offers (request_id);
create index offers_tailor_idx           on public.offers (tailor_id, updated_at desc);
create index offer_revisions_offer_idx   on public.offer_revisions (offer_id, revision);
create index orders_customer_idx         on public.orders (customer_id, created_at desc);
create index orders_tailor_idx           on public.orders (tailor_id, created_at desc);
create index order_events_order_idx      on public.order_events (order_id, created_at);
create index messages_order_idx          on public.messages (order_id, created_at);
create index reviews_tailor_idx          on public.reviews (tailor_id, created_at desc);
create index notifications_user_idx      on public.notifications (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Timestamps
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger requests_touch before update on public.requests
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Profile creation on sign-up. The role is chosen once, here, and can never be
-- changed afterwards (no UPDATE grant on the column).
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_role text := new.raw_user_meta_data ->> 'role';
  v_name text := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
begin
  if v_role is null or v_role not in ('customer', 'tailor') then
    raise exception 'INVALID_ROLE';
  end if;
  insert into public.profiles (id, role, full_name)
  values (new.id, v_role::public.user_role, left(coalesce(v_name, split_part(new.email, '@', 1)), 80));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Helper predicates (SECURITY DEFINER so policies do not recurse into each
-- other's RLS). They only ever answer about the calling user.
-- -----------------------------------------------------------------------------
create or replace function public.app_role()
returns public.user_role language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.owns_request(p_request_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.requests where id = p_request_id and customer_id = auth.uid())
$$;

create or replace function public.has_offer_on(p_request_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.offers where request_id = p_request_id and tailor_id = auth.uid())
$$;

create or replace function public.owns_offer(p_offer_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.offers where id = p_offer_id and tailor_id = auth.uid())
$$;

create or replace function public.is_order_participant(p_order_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.orders
    where id = p_order_id and auth.uid() in (customer_id, tailor_id)
  )
$$;

-- Internal: write a notification. Not callable by clients.
create or replace function public.notify(
  p_user_id uuid, p_kind text, p_title text, p_body text, p_link text
) returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, kind, title, body, link)
  values (p_user_id, p_kind, p_title, p_body, p_link)
$$;

-- -----------------------------------------------------------------------------
-- Privileges. Supabase grants ALL on new public tables to anon/authenticated by
-- default — revoke everything, then grant back only what each table needs.
-- -----------------------------------------------------------------------------
revoke all on public.profiles, public.requests, public.offers, public.offer_revisions,
              public.orders, public.order_events, public.messages, public.reviews,
              public.notifications
  from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, city, bio, specialties, years_experience) on public.profiles to authenticated;

grant select on public.requests to authenticated;
grant insert (title, description, garment_type, desired_date, image_path, ai_assisted) on public.requests to authenticated;
grant update (title, description, garment_type, desired_date, image_path) on public.requests to authenticated;

grant select on public.offers, public.offer_revisions, public.orders, public.order_events,
                public.reviews to authenticated;

grant select on public.messages to authenticated;
grant insert (order_id, body) on public.messages to authenticated;

grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

revoke execute on function public.notify(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.app_role(), public.owns_request(uuid), public.has_offer_on(uuid),
                           public.owns_offer(uuid), public.is_order_participant(uuid)
  from public, anon;
grant execute on function public.app_role(), public.owns_request(uuid), public.has_offer_on(uuid),
                          public.owns_offer(uuid), public.is_order_participant(uuid)
  to authenticated;

-- -----------------------------------------------------------------------------
-- Row level security
-- -----------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.requests        enable row level security;
alter table public.offers          enable row level security;
alter table public.offer_revisions enable row level security;
alter table public.orders          enable row level security;
alter table public.order_events    enable row level security;
alter table public.messages        enable row level security;
alter table public.reviews         enable row level security;
alter table public.notifications   enable row level security;

-- Profiles: names/specialties are the marketplace's public face (no email here).
create policy profiles_read on public.profiles
  for select to authenticated using (true);
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Requests
create policy requests_read on public.requests
  for select to authenticated using (
    customer_id = (select auth.uid())
    or (status = 'open' and (select public.app_role()) = 'tailor')
    or public.has_offer_on(id)
  );
create policy requests_insert on public.requests
  for insert to authenticated with check (
    customer_id = (select auth.uid())
    and (select public.app_role()) = 'customer'
    and status = 'open'
    and desired_date >= current_date
    and (image_path is null or split_part(image_path, '/', 1) = (select auth.uid())::text)
  );
create policy requests_update_own_open on public.requests
  for update to authenticated
  using (customer_id = (select auth.uid()) and status = 'open')
  with check (
    customer_id = (select auth.uid())
    and status = 'open'
    and (image_path is null or split_part(image_path, '/', 1) = (select auth.uid())::text)
  );

-- Offers: a tailor sees only their own; the request owner sees all offers on
-- their request. Nobody else — including competing tailors — gets a row.
create policy offers_read on public.offers
  for select to authenticated using (
    tailor_id = (select auth.uid()) or public.owns_request(request_id)
  );

-- Revision history: only the tailor who wrote the offer.
create policy offer_revisions_read on public.offer_revisions
  for select to authenticated using (public.owns_offer(offer_id));

-- Orders / events / messages: participants only.
create policy orders_read on public.orders
  for select to authenticated using ((select auth.uid()) in (customer_id, tailor_id));
create policy order_events_read on public.order_events
  for select to authenticated using (public.is_order_participant(order_id));
create policy messages_read on public.messages
  for select to authenticated using (public.is_order_participant(order_id));
create policy messages_insert on public.messages
  for insert to authenticated with check (
    sender_id = (select auth.uid()) and public.is_order_participant(order_id)
  );

-- Reviews are public reputation for tailors.
create policy reviews_read on public.reviews
  for select to authenticated using (true);

-- Notifications: own only.
create policy notifications_read on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy notifications_update on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Marketplace operations
-- Errors are raised as stable codes (e.g. 'REQUEST_CLOSED') that the app maps
-- to human-readable messages.
-- -----------------------------------------------------------------------------

-- Submit or revise the caller's single offer on a request.
create or replace function public.submit_offer(
  p_request_id uuid, p_price numeric, p_turnaround_days integer, p_message text
) returns public.offers
language plpgsql security definer set search_path = '' as $$
declare
  v_uid     uuid := auth.uid();
  v_request public.requests;
  v_offer   public.offers;
  v_msg     text := btrim(coalesce(p_message, ''));
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if public.app_role() is distinct from 'tailor' then raise exception 'ONLY_TAILORS_CAN_OFFER'; end if;

  -- Lock the request: serialises against accept_offer so a closing request
  -- can never receive or change an offer.
  select * into v_request from public.requests where id = p_request_id for update;
  if not found then raise exception 'REQUEST_NOT_FOUND'; end if;
  if v_request.status <> 'open' then raise exception 'REQUEST_CLOSED'; end if;
  if v_request.customer_id = v_uid then raise exception 'FORBIDDEN'; end if;

  if p_price is null or p_price <= 0 or p_price > 100000
     or p_turnaround_days is null or p_turnaround_days < 1 or p_turnaround_days > 365
     or char_length(v_msg) < 1 or char_length(v_msg) > 1500 then
    raise exception 'INVALID_OFFER';
  end if;

  select * into v_offer from public.offers
   where request_id = p_request_id and tailor_id = v_uid for update;

  if not found then
    insert into public.offers (request_id, tailor_id, price, turnaround_days, message)
    values (p_request_id, v_uid, round(p_price, 3), p_turnaround_days, v_msg)
    returning * into v_offer;

    perform public.notify(v_request.customer_id, 'offer_received',
      'New offer on “' || v_request.title || '”',
      'A tailor sent you an offer. Compare it with others when you are ready.',
      '/requests/' || v_request.id);
  else
    if v_offer.status in ('accepted', 'closed') then raise exception 'OFFER_LOCKED'; end if;

    update public.offers
       set price = round(p_price, 3), turnaround_days = p_turnaround_days, message = v_msg,
           revision = revision + 1, status = 'pending', decided_at = null, updated_at = now()
     where id = v_offer.id
    returning * into v_offer;

    perform public.notify(v_request.customer_id, 'offer_revised',
      'An offer on “' || v_request.title || '” was revised',
      'A tailor updated their price, timing or note.',
      '/requests/' || v_request.id);
  end if;

  insert into public.offer_revisions (offer_id, revision, price, turnaround_days, message)
  values (v_offer.id, v_offer.revision, v_offer.price, v_offer.turnaround_days, v_offer.message);

  return v_offer;
end $$;

-- Customer declines one offer (the tailor may revise while the request is open).
create or replace function public.decline_offer(p_offer_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid     uuid := auth.uid();
  v_offer   public.offers;
  v_request public.requests;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;

  select * into v_offer from public.offers where id = p_offer_id;
  if not found then raise exception 'OFFER_NOT_FOUND'; end if;

  select * into v_request from public.requests where id = v_offer.request_id for update;
  if v_request.customer_id <> v_uid then raise exception 'OFFER_NOT_FOUND'; end if;
  if v_request.status <> 'open' then raise exception 'REQUEST_CLOSED'; end if;

  select * into v_offer from public.offers where id = p_offer_id for update;
  if v_offer.status <> 'pending' then raise exception 'OFFER_NOT_PENDING'; end if;

  update public.offers set status = 'declined', decided_at = now(), updated_at = now()
   where id = p_offer_id;

  perform public.notify(v_offer.tailor_id, 'offer_declined',
    'Your offer on “' || v_request.title || '” was declined',
    'You can revise it while the request remains open.',
    '/browse/' || v_request.id);
end $$;

-- Customer accepts exactly one offer: closes the request, freezes all other
-- offers and creates the order — atomically.
create or replace function public.accept_offer(p_request_id uuid, p_offer_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid      uuid := auth.uid();
  v_request  public.requests;
  v_offer    public.offers;
  v_order_id uuid;
  v_number   bigint;
  v_other    record;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;

  select * into v_request from public.requests where id = p_request_id for update;
  if not found or v_request.customer_id <> v_uid then
    -- Covers tailors accepting their own offer and customers targeting
    -- someone else's request. Same answer as "does not exist".
    raise exception 'REQUEST_NOT_FOUND';
  end if;
  if v_request.status <> 'open' then raise exception 'REQUEST_CLOSED'; end if;

  select * into v_offer from public.offers
   where id = p_offer_id and request_id = p_request_id for update;
  if not found then raise exception 'OFFER_NOT_FOUND'; end if;
  if v_offer.tailor_id = v_uid then raise exception 'FORBIDDEN'; end if;
  if v_offer.status <> 'pending' then raise exception 'OFFER_NOT_PENDING'; end if;

  update public.offers set status = 'accepted', decided_at = now(), updated_at = now()
   where id = v_offer.id;

  for v_other in
    update public.offers set status = 'closed', decided_at = now(), updated_at = now()
     where request_id = p_request_id and id <> v_offer.id and status in ('pending', 'declined')
    returning tailor_id
  loop
    perform public.notify(v_other.tailor_id, 'offer_closed',
      '“' || v_request.title || '” has closed',
      'The customer chose another tailor. Thank you for your offer.',
      '/offers');
  end loop;

  update public.requests set status = 'closed', closed_at = now() where id = p_request_id;

  insert into public.orders (request_id, offer_id, customer_id, tailor_id, price, turnaround_days)
  values (p_request_id, v_offer.id, v_uid, v_offer.tailor_id, v_offer.price, v_offer.turnaround_days)
  returning id, order_number into v_order_id, v_number;

  insert into public.order_events (order_id, from_status, to_status, actor_id)
  values (v_order_id, null, 'accepted', v_uid);

  perform public.notify(v_offer.tailor_id, 'offer_accepted',
    'Your offer was accepted',
    '“' || v_request.title || '” is now order #' || v_number || '. Say hello to your customer.',
    '/orders/' || v_order_id);
  perform public.notify(v_uid, 'order_created',
    'Order #' || v_number || ' created',
    'Your private chat with the tailor is now open.',
    '/orders/' || v_order_id);

  return v_order_id;
end $$;

-- Tailor advances the order exactly one step.
create or replace function public.advance_order(p_order_id uuid, p_to_status public.order_status)
returns public.orders language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  v_order public.orders;
  v_next  public.order_status;
  v_title text;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_uid not in (v_order.customer_id, v_order.tailor_id) then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_uid <> v_order.tailor_id then raise exception 'ONLY_TAILOR_CAN_UPDATE'; end if;

  v_next := case v_order.status
    when 'accepted'    then 'in_progress'::public.order_status
    when 'in_progress' then 'ready'::public.order_status
    when 'ready'       then 'completed'::public.order_status
    else null end;

  if v_next is null or p_to_status is distinct from v_next then
    raise exception 'INVALID_TRANSITION';
  end if;

  update public.orders set
    status       = v_next,
    started_at   = case when v_next = 'in_progress' then now() else started_at end,
    ready_at     = case when v_next = 'ready' then now() else ready_at end,
    completed_at = case when v_next = 'completed' then now() else completed_at end,
    updated_at   = now()
  where id = p_order_id
  returning * into v_order;

  insert into public.order_events (order_id, from_status, to_status, actor_id)
  values (p_order_id, case v_next when 'in_progress' then 'accepted'::public.order_status
                                  when 'ready' then 'in_progress'::public.order_status
                                  else 'ready'::public.order_status end, v_next, v_uid);

  select title into v_title from public.requests where id = v_order.request_id;

  if v_next = 'in_progress' then
    perform public.notify(v_order.customer_id, 'order_in_progress',
      'Your order is now in progress', 'Work has started on “' || v_title || '”.',
      '/orders/' || p_order_id);
  elsif v_next = 'ready' then
    perform public.notify(v_order.customer_id, 'order_ready',
      'Your order is ready', '“' || v_title || '” is ready. Arrange collection with your tailor in the chat.',
      '/orders/' || p_order_id);
  else
    perform public.notify(v_order.customer_id, 'order_completed',
      'Your order has been completed', 'You can now leave a review for “' || v_title || '”.',
      '/orders/' || p_order_id || '/review');
  end if;

  return v_order;
end $$;

-- Customer reviews their own completed order, once.
create or replace function public.create_review(p_order_id uuid, p_rating integer, p_comment text)
returns public.reviews language plpgsql security definer set search_path = '' as $$
declare
  v_uid    uuid := auth.uid();
  v_order  public.orders;
  v_review public.reviews;
  v_text   text := nullif(btrim(coalesce(p_comment, '')), '');
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_uid not in (v_order.customer_id, v_order.tailor_id) then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_uid <> v_order.customer_id then raise exception 'ONLY_CUSTOMER_CAN_REVIEW'; end if;
  if v_order.status <> 'completed' then raise exception 'ORDER_NOT_COMPLETED'; end if;
  if exists (select 1 from public.reviews where order_id = p_order_id) then
    raise exception 'ALREADY_REVIEWED';
  end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'INVALID_RATING'; end if;
  if v_text is not null and char_length(v_text) > 1500 then raise exception 'INVALID_REVIEW'; end if;

  insert into public.reviews (order_id, customer_id, tailor_id, rating, comment)
  values (p_order_id, v_uid, v_order.tailor_id, p_rating, v_text)
  returning * into v_review;

  perform public.notify(v_order.tailor_id, 'review_received',
    'You received a ' || p_rating || '-star review',
    'Order #' || v_order.order_number || ' has been reviewed by your customer.',
    '/orders/' || p_order_id);

  return v_review;
exception
  when unique_violation then raise exception 'ALREADY_REVIEWED';
end $$;

-- -----------------------------------------------------------------------------
-- Read models that intentionally expose aggregates only (blind bidding).
-- -----------------------------------------------------------------------------

-- Open requests for tailors, with the number of offers — never their contents.
create or replace function public.tailor_request_feed()
returns table (
  id uuid, title text, description text, garment_type text, desired_date date,
  image_path text, created_at timestamptz, updated_at timestamptz, customer_city text,
  offer_count integer, my_offer_status public.offer_status
) language plpgsql stable security definer set search_path = '' as $$
begin
  if public.app_role() is distinct from 'tailor' then raise exception 'ONLY_TAILORS_CAN_OFFER'; end if;
  return query
    select r.id, r.title, r.description, r.garment_type, r.desired_date, r.image_path,
           r.created_at, r.updated_at, p.city,
           (select count(*)::integer from public.offers o where o.request_id = r.id),
           (select o.status from public.offers o where o.request_id = r.id and o.tailor_id = auth.uid())
      from public.requests r
      join public.profiles p on p.id = r.customer_id
     where r.status = 'open'
     order by r.created_at desc
     limit 200;
end $$;

-- Competition on one request: a count, for anyone allowed to see the request.
create or replace function public.request_offer_count(p_request_id uuid)
returns integer language plpgsql stable security definer set search_path = '' as $$
declare
  v_request public.requests;
begin
  select * into v_request from public.requests where id = p_request_id;
  if not found or not (
       v_request.customer_id = auth.uid()
    or (v_request.status = 'open' and public.app_role() = 'tailor')
    or public.has_offer_on(p_request_id)
  ) then
    raise exception 'REQUEST_NOT_FOUND';
  end if;
  return (select count(*)::integer from public.offers where request_id = p_request_id);
end $$;

-- Public reputation numbers for tailors.
create or replace function public.tailor_stats(p_tailor_ids uuid[])
returns table (tailor_id uuid, review_count integer, avg_rating numeric, completed_orders integer)
language sql stable security definer set search_path = '' as $$
  select t.id,
         (select count(*)::integer from public.reviews r where r.tailor_id = t.id),
         (select round(avg(r.rating)::numeric, 1) from public.reviews r where r.tailor_id = t.id),
         (select count(*)::integer from public.orders o where o.tailor_id = t.id and o.status = 'completed')
    from unnest(p_tailor_ids[1:100]) as t(id)
$$;

revoke execute on function
  public.submit_offer(uuid, numeric, integer, text), public.decline_offer(uuid),
  public.accept_offer(uuid, uuid), public.advance_order(uuid, public.order_status),
  public.create_review(uuid, integer, text), public.tailor_request_feed(),
  public.request_offer_count(uuid), public.tailor_stats(uuid[])
  from public, anon;
grant execute on function
  public.submit_offer(uuid, numeric, integer, text), public.decline_offer(uuid),
  public.accept_offer(uuid, uuid), public.advance_order(uuid, public.order_status),
  public.create_review(uuid, integer, text), public.tailor_request_feed(),
  public.request_offer_count(uuid), public.tailor_stats(uuid[])
  to authenticated;

-- -----------------------------------------------------------------------------
-- Storage: private reference images. Upload into your own folder; read an image
-- only if it is yours or belongs to a request you are allowed to see.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('request-images', 'request-images', false, 8388608,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy request_images_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'request-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.app_role()) = 'customer'
  );

create policy request_images_read on storage.objects
  for select to authenticated using (
    bucket_id = 'request-images'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      -- evaluated with the caller's own RLS on requests
      or exists (select 1 from public.requests r where r.image_path = storage.objects.name)
    )
  );

create policy request_images_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'request-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and not exists (select 1 from public.requests r where r.image_path = storage.objects.name)
  );

-- -----------------------------------------------------------------------------
-- Realtime (RLS still applies to change events)
-- -----------------------------------------------------------------------------
alter publication supabase_realtime add table public.messages, public.notifications;
