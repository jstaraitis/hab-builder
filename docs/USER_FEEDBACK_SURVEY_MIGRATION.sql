-- User feedback survey table
-- Run in Supabase SQL editor

create table if not exists user_feedback_surveys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  heard_about_us text not null,
  keeper_level text not null,
  animals_selected text[] not null default '{}',
  primary_goal text not null,
  biggest_challenge text not null,
  requested_feature text not null,
  satisfaction_score integer not null check (satisfaction_score between 1 and 5),
  additional_feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_feedback_surveys_one_response_per_user unique (user_id)
);

create index if not exists idx_user_feedback_surveys_user_id on user_feedback_surveys(user_id);
create index if not exists idx_user_feedback_surveys_created_at on user_feedback_surveys(created_at desc);

alter table user_feedback_surveys enable row level security;

drop policy if exists "Users can view own survey response" on user_feedback_surveys;
create policy "Users can view own survey response"
  on user_feedback_surveys for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own survey response" on user_feedback_surveys;
create policy "Users can insert own survey response"
  on user_feedback_surveys for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own survey response" on user_feedback_surveys;
create policy "Users can update own survey response"
  on user_feedback_surveys for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function set_user_feedback_surveys_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_user_feedback_surveys_updated_at on user_feedback_surveys;
create trigger trg_user_feedback_surveys_updated_at
before update on user_feedback_surveys
for each row
execute function set_user_feedback_surveys_updated_at();
