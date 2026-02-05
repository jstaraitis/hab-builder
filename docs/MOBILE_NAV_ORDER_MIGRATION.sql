-- Mobile Nav Order: create profiles table (if missing), add column + RLS update

-- Create minimal profiles table if it doesn't exist
create table if not exists profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	display_name text,
	is_premium boolean default false,
	mobile_nav_order jsonb,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

alter table profiles
add column if not exists mobile_nav_order jsonb;

alter table profiles
add column if not exists display_name text;

alter table profiles
add column if not exists is_premium boolean default false;

-- Ensure RLS is enabled (if not already)
alter table profiles enable row level security;

-- Drop existing policies (Supabase doesn't support IF NOT EXISTS for policies)
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can insert own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;

-- Users can view own profile
create policy "Users can view own profile" on profiles
for select
using (auth.uid() = id);

-- Users can insert own profile
create policy "Users can insert own profile" on profiles
for insert
with check (auth.uid() = id);

-- Users can update own profile
create policy "Users can update own profile" on profiles
for update
using (auth.uid() = id);
