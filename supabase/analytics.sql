-- ============================================================
-- ElectroHomeSY - visitor statistics (admin panel "الزيارات" tab)
-- Run after schema.sql. No personal data: no IP, no name; visitor_id is a
-- random id kept in the visitor's browser to count unique visitors.
-- ============================================================

create table if not exists public.page_events (
    id bigint generated always as identity primary key,
    created_at timestamptz not null default now(),
    event_type text not null default 'view' check (event_type in ('view', 'add_to_cart', 'order')),
    page_type text not null default 'other' check (page_type in ('home', 'product', 'category', 'cart', 'other')),
    path text not null default '',
    product_id bigint,
    source text not null default 'direct',
    referrer_host text not null default '',
    utm_source text not null default '',
    utm_campaign text not null default '',
    device text not null default 'mobile' check (device in ('mobile', 'tablet', 'desktop')),
    visitor_id text not null default ''
);
create index if not exists page_events_created_at_idx on public.page_events (created_at);
alter table public.page_events enable row level security;

-- Visitors can only add events (with sane sizes); only the admin reads them.
-- (created only if missing, so the file can be re-run)
do $$
begin
    if not exists (select 1 from pg_policies where tablename = 'page_events' and policyname = 'page_events_public_insert') then
        create policy "page_events_public_insert" on public.page_events
            for insert to anon, authenticated
            with check (
                length(path) <= 300 and length(source) <= 40 and length(referrer_host) <= 120
                and length(utm_source) <= 80 and length(utm_campaign) <= 120 and length(visitor_id) <= 64
            );
    end if;
    if not exists (select 1 from pg_policies where tablename = 'page_events' and policyname = 'page_events_admin_select') then
        create policy "page_events_admin_select" on public.page_events
            for select to authenticated using (public.is_admin());
    end if;
    if not exists (select 1 from pg_policies where tablename = 'page_events' and policyname = 'page_events_admin_delete') then
        create policy "page_events_admin_delete" on public.page_events
            for delete to authenticated using (public.is_admin());
    end if;
end $$;

-- Aggregates for the admin panel, computed in the database
create or replace function public.analytics_summary(days int default 30)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
    -- days are counted in Damascus time
    today_local timestamp := date_trunc('day', now() at time zone 'Asia/Damascus');
    since_local timestamp := today_local - make_interval(days => greatest(days, 1) - 1);
    since timestamptz := since_local at time zone 'Asia/Damascus';
    result jsonb;
begin
    if not public.is_admin() then
        raise exception 'not allowed';
    end if;

    with ev as (select * from public.page_events where created_at >= since),
    views as (select * from ev where event_type = 'view')
    select jsonb_build_object(
        'since', since,
        'views', (select count(*) from views),
        'visitors', (select count(distinct visitor_id) from views where visitor_id <> ''),
        'product_views', (select count(*) from views where page_type = 'product'),
        'add_to_cart', (select count(*) from ev where event_type = 'add_to_cart'),
        'orders', (select count(*) from public.orders where created_at >= since and status <> 'cancelled'),
        'daily', coalesce((
            select jsonb_agg(jsonb_build_object('day', d::date, 'views', coalesce(v.views, 0), 'visitors', coalesce(v.visitors, 0)) order by d)
            from generate_series(since_local, today_local, interval '1 day') d
            left join (
                select date_trunc('day', created_at at time zone 'Asia/Damascus') as day, count(*) as views, count(distinct visitor_id) as visitors
                from views group by 1
            ) v on v.day = d
        ), '[]'::jsonb),
        'sources', coalesce((
            select jsonb_agg(jsonb_build_object('source', source, 'views', n, 'visitors', u) order by n desc)
            from (select source, count(*) n, count(distinct visitor_id) u from views group by source) s
        ), '[]'::jsonb),
        'referrers', coalesce((
            select jsonb_agg(jsonb_build_object('host', referrer_host, 'views', n) order by n desc)
            from (select referrer_host, count(*) n from views where referrer_host <> '' group by referrer_host order by n desc limit 10) r
        ), '[]'::jsonb),
        'campaigns', coalesce((
            select jsonb_agg(jsonb_build_object('campaign', utm_campaign, 'source', utm_source, 'views', n) order by n desc)
            from (select utm_campaign, utm_source, count(*) n from views where utm_campaign <> '' or utm_source <> '' group by 1, 2 order by n desc limit 10) c
        ), '[]'::jsonb),
        'devices', coalesce((
            select jsonb_agg(jsonb_build_object('device', device, 'views', n) order by n desc)
            from (select device, count(*) n from views group by device) dv
        ), '[]'::jsonb),
        'products', coalesce((
            select jsonb_agg(jsonb_build_object('product_id', product_id, 'views', views, 'add_to_cart', carts) order by views desc, carts desc)
            from (
                select product_id,
                       count(*) filter (where event_type = 'view') as views,
                       count(*) filter (where event_type = 'add_to_cart') as carts
                from ev where product_id is not null
                group by product_id order by views desc, carts desc limit 20
            ) p
        ), '[]'::jsonb)
    ) into result;
    return result;
end;
$$;

revoke execute on function public.analytics_summary(int) from public, anon;
grant execute on function public.analytics_summary(int) to authenticated;
