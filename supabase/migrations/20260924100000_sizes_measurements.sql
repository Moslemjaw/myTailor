-- =============================================================================
-- MyTailor — size and optional measurements on requests
--
-- Size is part of the public brief (tailors use it to price).
-- Measurements are personal body data: they live in their own table and are
-- readable only by the customer who owns the request and — once an offer is
-- accepted — the tailor on that order. Browsing tailors only learn *that*
-- measurements exist, via requests.has_measurements.
-- =============================================================================

alter table public.requests
  add column size text check (size is null or size in ('XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL')),
  add column has_measurements boolean not null default false;

-- size is written by the customer like the other brief fields;
-- has_measurements is maintained by a trigger and never granted.
grant insert (size) on public.requests to authenticated;
grant update (size) on public.requests to authenticated;

-- Known measurement keys, all in centimetres, 1–300.
create or replace function private.valid_measurements(p jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select jsonb_typeof(p) = 'object'
     and not exists (
       select 1
         from jsonb_each(p) as e(key, value)
        where e.key not in ('height', 'chest', 'bust', 'waist', 'hips', 'shoulders',
                            'sleeve', 'inseam', 'neck', 'length', 'thigh')
           or case when jsonb_typeof(e.value) = 'number'
                   then (e.value)::numeric < 1 or (e.value)::numeric > 300
                   else true end
     )
$$;

create table public.request_measurements (
  request_id uuid primary key references public.requests (id) on delete cascade,
  data       jsonb not null check (private.valid_measurements(data)),
  updated_at timestamptz not null default now()
);

alter table public.request_measurements enable row level security;
revoke all on public.request_measurements from anon, authenticated;
grant select, insert, update, delete on public.request_measurements to authenticated;

-- Owner can always read; the chosen tailor can read once an order exists.
create policy request_measurements_read on public.request_measurements
  for select to authenticated using (
    private.owns_request(request_id)
    or exists (
      select 1 from public.orders o
       where o.request_id = request_measurements.request_id
         and o.tailor_id = (select auth.uid())
    )
  );

-- Owner can write only while the request is open (the brief freezes on acceptance).
create policy request_measurements_insert on public.request_measurements
  for insert to authenticated with check (
    private.owns_request(request_id)
    and exists (select 1 from public.requests r where r.id = request_id and r.status = 'open')
  );
create policy request_measurements_update on public.request_measurements
  for update to authenticated
  using (
    private.owns_request(request_id)
    and exists (select 1 from public.requests r where r.id = request_id and r.status = 'open')
  )
  with check (private.owns_request(request_id));
create policy request_measurements_delete on public.request_measurements
  for delete to authenticated using (
    private.owns_request(request_id)
    and exists (select 1 from public.requests r where r.id = request_id and r.status = 'open')
  );

-- Keep the public "measurements provided" flag in sync.
create or replace function private.sync_has_measurements()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    update public.requests set has_measurements = false where id = old.request_id;
  else
    update public.requests set has_measurements = (new.data <> '{}'::jsonb) where id = new.request_id;
  end if;
  return null;
end $$;

revoke execute on function private.sync_has_measurements() from public, anon, authenticated;

create trigger request_measurements_sync
  after insert or update or delete on public.request_measurements
  for each row execute function private.sync_has_measurements();

-- Marketplace feed: add size + the measurements flag (never the values).
drop function public.tailor_request_feed();
create function public.tailor_request_feed()
returns table (
  id uuid, title text, description text, garment_type text, desired_date date,
  image_path text, created_at timestamptz, updated_at timestamptz, customer_city text,
  offer_count integer, my_offer_status public.offer_status,
  size text, has_measurements boolean
) language plpgsql stable security definer set search_path = '' as $$
begin
  if private.app_role() is distinct from 'tailor' then raise exception 'ONLY_TAILORS_CAN_OFFER'; end if;
  return query
    select r.id, r.title, r.description, r.garment_type, r.desired_date, r.image_path,
           r.created_at, r.updated_at, p.city,
           (select count(*)::integer from public.offers o where o.request_id = r.id),
           (select o.status from public.offers o where o.request_id = r.id and o.tailor_id = auth.uid()),
           r.size, r.has_measurements
      from public.requests r
      join public.profiles p on p.id = r.customer_id
     where r.status = 'open'
     order by r.created_at desc
     limit 200;
end $$;

revoke execute on function public.tailor_request_feed() from public, anon;
grant execute on function public.tailor_request_feed() to authenticated;
