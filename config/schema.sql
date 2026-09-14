-- Apply with: psql "$DATABASE_URL" -f config/schema.sql
-- Use a dedicated server role. Never grant browser roles access to these tables.
begin;
create table if not exists swap_quotes (
 id uuid primary key, wallet_address text not null check (wallet_address ~ '^0x[0-9a-f]{40}$'),
 expires_at timestamptz not null, data jsonb not null, created_at timestamptz not null default now()
);
create table if not exists swaps (
 id uuid primary key, public_id uuid not null unique, quote_id uuid not null unique references swap_quotes(id),
 wallet_address text not null check (wallet_address ~ '^0x[0-9a-f]{40}$'), chain_id integer not null,
 status text not null check (status in ('READY_TO_SWAP','SWAP_SUBMITTED','CONFIRMING','COMPLETED','FAILED')),
 tx_hash text, scan_cursor numeric(78,0) not null, data jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(chain_id,tx_hash)
);
create index if not exists swaps_wallet_created_idx on swaps(wallet_address,created_at desc);
create index if not exists swaps_pending_idx on swaps(status) where status not in ('COMPLETED','FAILED');
create table if not exists analytics_events(id bigint generated always as identity primary key,event text not null,properties jsonb not null default '{}',created_at timestamptz not null default now());
create table if not exists api_rate_limits(key text not null,window_start timestamptz not null,count integer not null,primary key(key,window_start));
-- RLS prevents accidental access through a subsequently attached browser-facing database API.
alter table swap_quotes enable row level security;
alter table swaps enable row level security;
alter table analytics_events enable row level security;
alter table api_rate_limits enable row level security;
commit;
