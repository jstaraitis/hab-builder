import type { User } from '@supabase/supabase-js';

function parseCsvEnv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

const ownerIds = parseCsvEnv(import.meta.env.VITE_OWNER_USER_IDS);
const ownerEmails = parseCsvEnv(import.meta.env.VITE_OWNER_EMAILS);
const isOwnerConfigPresent = ownerIds.length > 0 || ownerEmails.length > 0;

function allowLocalOwnerBypass(): boolean {
  // Dev-only convenience: if owner env vars are not set locally, allow access
  // for authenticated users so owner pages can be developed without extra setup.
  return import.meta.env.DEV && !isOwnerConfigPresent;
}

export function isOwner(user: User | null): boolean {
  if (!user) return false;

  if (allowLocalOwnerBypass()) return true;

  const normalizedEmail = user.email?.toLowerCase() ?? '';
  const normalizedId = user.id.toLowerCase();

  return ownerIds.includes(normalizedId) || ownerEmails.includes(normalizedEmail);
}

export function ownerAccessConfigured(): boolean {
  return isOwnerConfigPresent || allowLocalOwnerBypass();
}