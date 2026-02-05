-- Inventory Reminders: table + indexes + RLS policies

-- Enable UUID extension if needed
-- create extension if not exists "uuid-ossp";

create table if not exists inventory_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  enclosure_id text,
  animal_id text,
  title text not null,
  category text not null,
  brand text,
  notes text,
  reminder_frequency text not null,
  custom_frequency_days integer,
  reminder_time text,
  next_due_at timestamptz not null,
  last_replaced_at timestamptz,
  buy_again_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_inventory_items_user_id on inventory_items(user_id);
create index if not exists idx_inventory_items_next_due on inventory_items(next_due_at);

alter table inventory_items enable row level security;

create policy "Users can view their inventory" on inventory_items
for select
using (auth.uid() = user_id);

create policy "Users can insert their inventory" on inventory_items
for insert
with check (auth.uid() = user_id);

create policy "Users can update their inventory" on inventory_items
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their inventory" on inventory_items
for delete
using (auth.uid() = user_id);
