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

export function isOwner(user: User | null): boolean {
  if (!user) return false;

  const normalizedEmail = user.email?.toLowerCase() ?? '';
  const normalizedId = user.id.toLowerCase();

  return ownerIds.includes(normalizedId) || ownerEmails.includes(normalizedEmail);
}

export function ownerAccessConfigured(): boolean {
  return ownerIds.length > 0 || ownerEmails.length > 0;
}