-- =============================================================================
-- MyTailor — hardening after Supabase advisor review
-- 1. Move RLS helper predicates out of the exposed `public` API schema into
--    `private`, so they are no longer callable via /rest/v1/rpc. Policies
--    reference functions by OID and keep working; the RPCs that call the
--    helpers by name are re-created below.
-- 2. Cover the remaining foreign keys with indexes.
-- =============================================================================

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.app_role()                  set schema private;
alter function public.owns_request(uuid)          set schema private;
alter function public.has_offer_on(uuid)          set schema private;
alter function public.owns_offer(uuid)            set schema private;
alter function public.is_order_participant(uuid)  set schema private;
alter function public.notify(uuid, text, text, text, text) set schema private;

-- RPCs that call helpers by name
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
  if private.app_role() is distinct from 'tailor' then raise exception 'ONLY_TAILORS_CAN_OFFER'; end if;

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

    perform private.notify(v_request.customer_id, 'offer_received',
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

    perform private.notify(v_request.customer_id, 'offer_revised',
      'An offer on “' || v_request.title || '” was revised',
      'A tailor updated their price, timing or note.',
      '/requests/' || v_request.id);
  end if;

  insert into public.offer_revisions (offer_id, revision, price, turnaround_days, message)
  values (v_offer.id, v_offer.revision, v_offer.price, v_offer.turnaround_days, v_offer.message);

  return v_offer;
end $$;

create or replace function public.tailor_request_feed()
returns table (
  id uuid, title text, description text, garment_type text, desired_date date,
  image_path text, created_at timestamptz, updated_at timestamptz, customer_city text,
  offer_count integer, my_offer_status public.offer_status
) language plpgsql stable security definer set search_path = '' as $$
begin
  if private.app_role() is distinct from 'tailor' then raise exception 'ONLY_TAILORS_CAN_OFFER'; end if;
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

create or replace function public.request_offer_count(p_request_id uuid)
returns integer language plpgsql stable security definer set search_path = '' as $$
declare
  v_request public.requests;
begin
  select * into v_request from public.requests where id = p_request_id;
  if not found or not (
       v_request.customer_id = auth.uid()
    or (v_request.status = 'open' and private.app_role() = 'tailor')
    or private.has_offer_on(p_request_id)
  ) then
    raise exception 'REQUEST_NOT_FOUND';
  end if;
  return (select count(*)::integer from public.offers where request_id = p_request_id);
end $$;

-- accept/decline/advance/review call notify() by name too

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

  perform private.notify(v_offer.tailor_id, 'offer_declined',
    'Your offer on “' || v_request.title || '” was declined',
    'You can revise it while the request remains open.',
    '/browse/' || v_request.id);
end $$;

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
    perform private.notify(v_other.tailor_id, 'offer_closed',
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

  perform private.notify(v_offer.tailor_id, 'offer_accepted',
    'Your offer was accepted',
    '“' || v_request.title || '” is now order #' || v_number || '. Say hello to your customer.',
    '/orders/' || v_order_id);
  perform private.notify(v_uid, 'order_created',
    'Order #' || v_number || ' created',
    'Your private chat with the tailor is now open.',
    '/orders/' || v_order_id);

  return v_order_id;
end $$;

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
    perform private.notify(v_order.customer_id, 'order_in_progress',
      'Your order is now in progress', 'Work has started on “' || v_title || '”.',
      '/orders/' || p_order_id);
  elsif v_next = 'ready' then
    perform private.notify(v_order.customer_id, 'order_ready',
      'Your order is ready', '“' || v_title || '” is ready. Arrange collection with your tailor in the chat.',
      '/orders/' || p_order_id);
  else
    perform private.notify(v_order.customer_id, 'order_completed',
      'Your order has been completed', 'You can now leave a review for “' || v_title || '”.',
      '/orders/' || p_order_id || '/review');
  end if;

  return v_order;
end $$;

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

  perform private.notify(v_order.tailor_id, 'review_received',
    'You received a ' || p_rating || '-star review',
    'Order #' || v_order.order_number || ' has been reviewed by your customer.',
    '/orders/' || p_order_id);

  return v_review;
exception
  when unique_violation then raise exception 'ALREADY_REVIEWED';
end $$;

create index if not exists messages_sender_idx      on public.messages (sender_id);
create index if not exists order_events_actor_idx   on public.order_events (actor_id);
create index if not exists reviews_customer_idx     on public.reviews (customer_id);
