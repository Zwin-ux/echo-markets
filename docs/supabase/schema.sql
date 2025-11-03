-- Echo Markets - Supabase schema (v0.2.x + v0.3 primitives)
-- Run this in the Supabase SQL editor

-- Enums (idempotent)
do $$ begin
  create type order_side as enum ('buy', 'sell');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_type as enum ('market', 'limit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('open', 'filled', 'cancelled');
exception when duplicate_object then null; end $$;

-- Users are handled by auth.users; mirror minimal profile data
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar text,
  joined_at timestamp with time zone default now(),
  level int default 1,
  xp int default 0,
  stats jsonb default '{}'
);

-- Portfolio per user
create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cash numeric(18,2) not null default 100.00,
  created_at timestamp with time zone default now()
);
create index if not exists portfolios_user_idx on public.portfolios(user_id);

-- Holdings per portfolio
create table if not exists public.holdings (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  symbol text not null,
  shares numeric(18,4) not null,
  avg_price numeric(18,4) not null,
  updated_at timestamp with time zone default now()
);
create index if not exists holdings_portfolio_idx on public.holdings(portfolio_id);
create index if not exists holdings_symbol_idx on public.holdings(symbol);

-- Orders per user (server authoritative)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  side order_side not null,
  order_type order_type not null,
  qty numeric(18,4) not null,
  limit_price numeric(18,4),
  status order_status not null default 'open',
  created_at timestamp with time zone default now()
);
create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_symbol_idx on public.orders(symbol);
create index if not exists orders_status_idx on public.orders(status);

-- Trades (executions)
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  price numeric(18,4) not null,
  qty numeric(18,4) not null,
  buy_user uuid references auth.users(id),
  sell_user uuid references auth.users(id),
  executed_at timestamp with time zone default now()
);
create index if not exists trades_symbol_idx on public.trades(symbol);
create index if not exists trades_time_idx on public.trades(executed_at desc);

-- Ticks (market prices)
create table if not exists public.ticks (
  id bigserial primary key,
  symbol text not null,
  price numeric(18,4) not null,
  ts timestamp with time zone not null default now()
);
create index if not exists ticks_symbol_time_idx on public.ticks(symbol, ts desc);

-- Leaderboard (daily PnL)
create table if not exists public.leaderboards (
  id bigserial primary key,
  day date not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  pnl numeric(18,2) not null default 0
);
create unique index if not exists leaderboard_day_user_uidx on public.leaderboards(day, user_id);

-- Events (narrative + market impulses)
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  symbol text,
  headline text not null,
  body text,
  impact_type text not null check (impact_type in ('PUMP','DUMP','PANIC','HYPE')),
  magnitude numeric(6,2) not null default 0,
  created_at timestamp with time zone default now()
);
create index if not exists events_time_idx on public.events(created_at desc);

-- Narratives (generated summaries)
create table if not exists public.narratives (
  id bigserial primary key,
  text text not null,
  created_at timestamp with time zone default now()
);
create index if not exists narratives_time_idx on public.narratives(created_at desc);

-- Helper views
create or replace view public.v_user_portfolio as
select p.user_id,
       p.id as portfolio_id,
        p.cash,
       coalesce(sum(h.shares * h.avg_price), 0) as invested_value
from public.portfolios p
left join public.holdings h on h.portfolio_id = p.id
group by p.user_id, p.id, p.cash;

-- RLS
alter table public.profiles enable row level security;
alter table public.portfolios enable row level security;
alter table public.holdings enable row level security;
alter table public.orders enable row level security;
alter table public.trades enable row level security;
alter table public.ticks enable row level security;
alter table public.leaderboards enable row level security;
alter table public.events enable row level security;
alter table public.narratives enable row level security;

-- Policies (drop-if-exists to avoid conflicts)
drop policy if exists "profiles_self" on public.profiles;
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "portfolios_self" on public.portfolios;
create policy "portfolios_self" on public.portfolios
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "holdings_by_owner" on public.holdings;
create policy "holdings_by_owner" on public.holdings
  for all using (exists (
    select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = auth.uid()
  )) with check (exists (
    select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = auth.uid()
  ));

drop policy if exists "orders_self" on public.orders;
create policy "orders_self" on public.orders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "trades_read_all" on public.trades;
create policy "trades_read_all" on public.trades
  for select using (true);

drop policy if exists "ticks_read_all" on public.ticks;
create policy "ticks_read_all" on public.ticks
  for select using (true);

drop policy if exists "leaderboards_read_all" on public.leaderboards;
create policy "leaderboards_read_all" on public.leaderboards
  for select using (true);

drop policy if exists "events_read_all" on public.events;
create policy "events_read_all" on public.events
  for select using (true);

drop policy if exists "narratives_read_all" on public.narratives;
create policy "narratives_read_all" on public.narratives
  for select using (true);

-- Basic RPCs
create or replace function public.init_user()
returns void language plpgsql security definer as $$
begin
  insert into public.profiles(user_id) values (auth.uid())
  on conflict (user_id) do nothing;

  insert into public.portfolios(user_id) values (auth.uid())
  on conflict do nothing;
end; $$;

create or replace function public.place_order(
  p_symbol text,
  p_side order_side,
  p_type order_type,
  p_qty numeric,
  p_limit_price numeric default null
) returns uuid language plpgsql security definer as $$
declare
  new_id uuid;
begin
  insert into public.orders(user_id, symbol, side, order_type, qty, limit_price)
  values (auth.uid(), p_symbol, p_side, p_type, p_qty, p_limit_price)
  returning id into new_id;
  return new_id;
end; $$;

create or replace function public.cancel_order(p_order_id uuid)
returns void language sql security definer as $$
  update public.orders set status = 'cancelled'
  where id = p_order_id and user_id = auth.uid() and status = 'open';
$$;
