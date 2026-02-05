import { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Auth } from '../Auth';
import { profileService } from '../../services/profileService';

interface ProfileFormState {
  displayName: string;
}

export function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'free' | 'premium'>('free');
  const [form, setForm] = useState<ProfileFormState>({ displayName: '' });

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const profile = await profileService.getProfile(user.id);
        setForm({ displayName: profile?.displayName || '' });
        setStatus(profile?.isPremium ? 'premium' : 'free');
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!form.displayName.trim()) {
      setError('Please enter a display name.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await profileService.updateProfile(user.id, {
        displayName: form.displayName.trim(),
      });
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 py-12">
        <Auth />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
          <User className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage your name and subscription status.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg p-4">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="profile-display-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display name</label>
              <input
                id="profile-display-name"
                value={form.displayName}
                onChange={(event) => setForm({ displayName: event.target.value })}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                placeholder="Your name"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">Subscription</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Premium unlocks custom nav order and more.</div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status === 'premium'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
              }`}>
                {status === 'premium' ? 'Premium' : 'Free'}
              </span>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                onClick={signOut}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                Log out
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
