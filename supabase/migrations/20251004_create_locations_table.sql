-- Create locations table
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('residential','commercial')),
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'US',
  latitude numeric(10,7),
  longitude numeric(10,7),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.locations enable row level security;

-- Policies (allow all authenticated users to CRUD for now)
create policy "Authenticated users can select locations"
  on public.locations for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert locations"
  on public.locations for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update locations"
  on public.locations for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users can delete locations"
  on public.locations for delete
  using (auth.role() = 'authenticated');

-- Updated_at trigger
create or replace function public.handle_locations_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_locations_updated_at
  before update on public.locations
  for each row
  execute function public.handle_locations_updated_at();

-- Create indexes for performance
create index if not exists locations_type_idx on public.locations(type);
create index if not exists locations_is_active_idx on public.locations(is_active);
create index if not exists locations_created_at_idx on public.locations(created_at desc);
