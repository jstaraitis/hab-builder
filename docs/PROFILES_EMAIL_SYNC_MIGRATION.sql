-- Add email and last_sign_in_at fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMP WITH TIME ZONE;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Backfill existing profiles with email from auth.users
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id AND p.email IS NULL;

-- Backfill existing profiles with last_sign_in_at from auth.users
UPDATE public.profiles p
SET last_sign_in_at = au.last_sign_in_at
FROM auth.users au
WHERE p.id = au.id AND p.last_sign_in_at IS NULL;

-- Create function to sync email and last_sign_in_at when auth.users changes
CREATE OR REPLACE FUNCTION public.sync_user_email_to_profiles()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email,
      last_sign_in_at = NEW.last_sign_in_at,
      updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users to sync changes to profiles
DROP TRIGGER IF EXISTS on_auth_user_update ON auth.users;
CREATE TRIGGER on_auth_user_update
AFTER UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_email_to_profiles();

-- Create function to sync email when new user is created
CREATE OR REPLACE FUNCTION public.sync_new_user_email_to_profiles()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email,
      last_sign_in_at = NEW.last_sign_in_at
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users insert to sync new users
DROP TRIGGER IF EXISTS on_auth_user_insert ON auth.users;
CREATE TRIGGER on_auth_user_insert
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_new_user_email_to_profiles();
