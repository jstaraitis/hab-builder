-- Add onboarding completion tracking to profiles so onboarding state is shared across devices.
alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;
