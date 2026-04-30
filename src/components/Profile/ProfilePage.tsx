import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  User,
  CreditCard,
  Lock,
  Bell,
  CheckCircle,
  Trash2,
  Sparkles,
  ChevronRight,
  Crown,
  Infinity,
  Brain,
  Thermometer,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePremium } from '../../contexts/PremiumContext';
import { Auth } from '../Auth';
import { profileService } from '../../services/profileService';
import { stripeService } from '../../services/stripeService';
import { supabase } from '../../lib/supabase';
import { notificationService } from '../../services/notificationService';
import { userSurveyService, type UserSurveyInput } from '../../services/userSurveyService';
import { UserSurveyForm } from './UserSurveyModal';

interface ProfileFormState {
  displayName: string;
}

interface PasswordFormState {
  newPassword: string;
  confirmPassword: string;
}

export function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { refreshProfile } = usePremium();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [reconnectingNotifications, setReconnectingNotifications] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<'not-supported' | 'denied' | 'not-subscribed' | 'subscribed'>('not-subscribed');
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [notificationSuccess, setNotificationSuccess] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [status, setStatus] = useState<'free' | 'premium'>('free');
  const [cancelDate, setCancelDate] = useState<string | null>(null);
  const [subscriptionPlatform, setSubscriptionPlatform] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileFormState>({ displayName: '' });
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    newPassword: '',
    confirmPassword: '',
  });
  const [showDisplayNameEditor, setShowDisplayNameEditor] = useState(false);
  const [showPasswordEditor, setShowPasswordEditor] = useState(false);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [surveySubmitting, setSurveySubmitting] = useState(false);
  const [surveySuccess, setSurveySuccess] = useState<string | null>(null);

  // Detect payment success redirect and refresh premium status
  const handlePaymentSuccess = useCallback(async () => {
    if (!user) return;

    // Remove ?success=true from URL immediately
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('success');
      return next;
    }, { replace: true });

    // Poll for premium status (webhook may take a few seconds)
    const maxAttempts = 6;
    const delayMs = 2000;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const profile = await profileService.getProfile(user.id);
        if (profile?.isPremium) {
          setStatus('premium');
          setPaymentSuccess(true);
          await refreshProfile(); // Sync context so the rest of the app updates
          return;
        }
      } catch {
        // ignore, will retry
      }
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => globalThis.setTimeout(r, delayMs));
      }
    }

    // If we still haven't detected premium after all retries, show success anyway
    // (the webhook may just be slow; the next page load will pick it up)
    setPaymentSuccess(true);
    await refreshProfile();
  }, [user, refreshProfile, setSearchParams]);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      handlePaymentSuccess();
    }
  }, [searchParams, handlePaymentSuccess]);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const [profile, hasCompletedSurvey] = await Promise.all([
          profileService.getProfile(user.id),
          userSurveyService.hasCompleted(user.id),
        ]);
        setForm({ displayName: profile?.displayName || '' });
        setStatus(profile?.isPremium ? 'premium' : 'free');
        setCancelDate(profile?.subscriptionCancelAt || null);
        setSubscriptionPlatform(profile?.subscriptionPlatform || null);
        setSurveyCompleted(hasCompletedSurvey);

        // Check notification status
        await checkNotificationStatus();
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const checkNotificationStatus = async () => {
    if (!notificationService.isSupported()) {
      setNotificationStatus('not-supported');
      return;
    }

    const permission = notificationService.getPermissionStatus();
    if (permission === 'denied') {
      setNotificationStatus('denied');
      return;
    }

    const isSubscribed = await notificationService.isSubscribed();
    setNotificationStatus(isSubscribed ? 'subscribed' : 'not-subscribed');
  };

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

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    try {
      setChangingPassword(true);
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      setPasswordSuccess('✓ Password changed successfully!');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      console.error('Failed to change password:', err);
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    try {
      setManagingSubscription(true);
      setError(null);

      if (subscriptionPlatform?.toLowerCase() === 'ios') {
        window.location.href = 'https://apps.apple.com/account/subscriptions';
        return;
      }
      
      // Get the user's session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No active session');
      }
      
      await stripeService.redirectToCustomerPortal(user.id, session.access_token);
    } catch (err) {
      console.error('Failed to open customer portal:', err);
      setError('Failed to open subscription management. Please try again.');
      setManagingSubscription(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setDeletingAccount(true);
      setDeleteError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No active session');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ userToken: session.access_token }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to delete account');
      }

      // User is already deleted server-side — clear local session only to avoid a 403 on logout
      await supabase.auth.signOut({ scope: 'local' });
      navigate('/');
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      setDeleteError(err.message || 'Failed to delete account. Please try again.');
      setDeletingAccount(false);
    }
  };

  const handleReconnectNotifications = async () => {
    setNotificationSuccess(null);

    try {
      setReconnectingNotifications(true);

      // Clear any blocking flags
      sessionStorage.removeItem('notification-prompt-dismissed');
      localStorage.removeItem('notification-prompt-seen');

      // Subscribe/resubscribe
      await notificationService.subscribe();

      setNotificationStatus('subscribed');
      setNotificationSuccess('✓ Notifications reconnected successfully!');
    } catch (err: any) {
      console.error('Failed to reconnect notifications:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to reconnect notifications';
      setError(errorMessage);
      await checkNotificationStatus();
    } finally {
      setReconnectingNotifications(false);
    }
  };

  const handleSubmitSurvey = async (input: UserSurveyInput) => {
    if (!user) return;

    try {
      setSurveySubmitting(true);
      setError(null);
      await userSurveyService.submitSurvey(user.id, input);
      setSurveyCompleted(true);
      setSurveySuccess('Thanks for completing the survey. Your feedback helps shape our roadmap.');
    } catch (err) {
      console.error('Failed to submit survey:', err);
      throw err;
    } finally {
      setSurveySubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-accent"></div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface py-12">
        <Auth />
      </div>
    );
  }

  const userDisplayName = form.displayName?.trim() || user.email?.split('@')[0] || 'Member';
  const userInitial = userDisplayName.charAt(0).toUpperCase();
  const membershipSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
  const isPremium = status === 'premium';

  return (
    <div className="min-h-screen bg-surface pb-28">
      <div className="space-y-4 px-4 pt-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Account</h2>
          <p className="mt-1 text-sm text-muted">Manage your profile, preferences and account settings.</p>
        </div>

        {paymentSuccess && (
          <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4 text-white">
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Payment successful!</p>
                <p className="text-sm text-white/80">Your premium features are now active. Thank you for supporting Habitat Builder!</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {surveySuccess && (
          <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4 text-sm text-white">
            {surveySuccess}
          </div>
        )}

        {!loading && !surveyCompleted && (
          <UserSurveyForm
            submitting={surveySubmitting}
            onSubmit={handleSubmitSurvey}
          />
        )}

        <section className="rounded-2xl border border-divider bg-card p-4 sm:p-5">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-accent" />
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 text-3xl font-semibold text-accent sm:h-20 sm:w-20 sm:text-4xl">
                  {userInitial}
                </div>

                <div>
                  <p className="text-2xl font-semibold text-white sm:text-3xl">{userDisplayName}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isPremium
                        ? 'bg-accent/15 text-accent ring-1 ring-accent/30'
                        : 'bg-card-elevated text-white ring-1 ring-divider'
                    }`}>
                      {isPremium ? <Crown className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                      {isPremium ? 'Premium' : 'Free'}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      cancelDate
                        ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30'
                        : 'bg-accent/15 text-accent ring-1 ring-accent/30'
                    }`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {cancelDate ? 'Cancelling' : 'Active'}
                    </span>
                  </div>
                  {membershipSince && (
                    <p className="mt-2 text-sm text-muted">Member since {membershipSince}</p>
                  )}
                </div>
              </div>

              {isPremium ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={managingSubscription}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-divider bg-card-elevated px-4 py-2.5 text-sm font-medium text-white transition hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  <CreditCard className="h-4 w-4" />
                  {managingSubscription ? 'Opening Portal...' : 'Manage Subscription'}
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => navigate('/upgrade')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-dim sm:w-auto"
                >
                  <Sparkles className="h-4 w-4" />
                  Upgrade to Premium
                </button>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-accent/30 bg-accent/10 p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-[1.2fr_repeat(4,1fr)] sm:items-center">
            <div className="col-span-2 flex items-start gap-3 sm:col-span-1">
              <div className="rounded-2xl bg-emerald-500/20 p-3 text-emerald-300 ring-1 ring-emerald-400/30">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xl font-semibold text-white sm:text-2xl">{isPremium ? 'Premium Active' : 'Premium Features'}</p>
                <p className="text-sm text-white/75">
                  {isPremium ? 'Thank you for supporting better care for your pets.' : 'Unlock advanced planning and care tools.'}
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-2 inline-flex rounded-full bg-emerald-500/20 p-2 text-emerald-300 ring-1 ring-emerald-400/30">
                <Infinity className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-white">Unlimited</p>
              <p className="text-xs text-white/70">animals</p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-2 inline-flex rounded-full bg-emerald-500/20 p-2 text-emerald-300 ring-1 ring-emerald-400/30">
                <Bell className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-white">Smart</p>
              <p className="text-xs text-white/70">reminders</p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-2 inline-flex rounded-full bg-emerald-500/20 p-2 text-emerald-300 ring-1 ring-emerald-400/30">
                <Brain className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-white">Advanced</p>
              <p className="text-xs text-white/70">insights</p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-2 inline-flex rounded-full bg-emerald-500/20 p-2 text-emerald-300 ring-1 ring-emerald-400/30">
                <Thermometer className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-white">Environment</p>
              <p className="text-xs text-white/70">tracking</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-divider bg-card p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-[1.2fr_1fr_auto] sm:items-center">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-violet-500/20 p-3 text-violet-300 ring-1 ring-violet-400/30">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white sm:text-3xl">Care Reminders</p>
                <p className="text-sm text-muted">Stay on track with feeding, misting, and more.</p>
                <p className="mt-1 text-xs text-muted">
                  {notificationStatus === 'not-supported' && 'Push notifications are not supported on this device.'}
                  {notificationStatus === 'denied' && 'Permission was denied. Enable notifications in browser settings.'}
                  {notificationStatus === 'subscribed' && 'Notifications are active for care reminders.'}
                  {notificationStatus === 'not-subscribed' && 'Enable notifications to receive reminders.'}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-white/90">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-violet-300" />
                Feeding and task reminders
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-violet-300" />
                Environment alerts
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-violet-300" />
                Daily check-ins
              </div>
            </div>

            <div className="sm:min-w-[210px]">
              {notificationStatus !== 'not-supported' && notificationStatus !== 'denied' && (
                <button
                  onClick={handleReconnectNotifications}
                  disabled={reconnectingNotifications}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    notificationStatus === 'subscribed'
                      ? 'border border-divider bg-card-elevated text-white hover:border-accent/40'
                      : 'bg-accent text-on-accent hover:bg-accent-dim'
                  }`}
                >
                  {reconnectingNotifications
                    ? 'Reconnecting...'
                    : notificationStatus === 'subscribed'
                      ? 'Refresh Connection'
                      : 'Enable Notifications'}
                </button>
              )}
              <p className="mt-2 text-center text-xs text-muted">You can customize these after enabling.</p>

              {notificationSuccess && (
                <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-200">
                  {notificationSuccess}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-divider bg-card p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-sky-500/20 p-2 text-sky-300 ring-1 ring-sky-400/30">
              <Settings className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-semibold text-white sm:text-2xl">Account Settings</h3>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowDisplayNameEditor((prev) => !prev)}
              className="w-full rounded-xl border border-divider bg-card-elevated px-4 py-3 text-left transition hover:border-accent/40"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-100">Display Name</p>
                    <p className="text-xs text-slate-400">{userDisplayName}</p>
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 text-muted transition ${showDisplayNameEditor ? 'rotate-90' : ''}`} />
              </div>
            </button>

            {showDisplayNameEditor && (
              <div className="rounded-xl border border-divider bg-card-elevated p-4">
                <label htmlFor="profile-display-name" className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Display Name
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="profile-display-name"
                    value={form.displayName}
                    onChange={(event) => setForm({ displayName: event.target.value })}
                    className="w-full rounded-lg border border-divider bg-card px-3 py-2.5 text-sm text-white placeholder:text-muted"
                    placeholder="Your name"
                  />
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-dim disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowPasswordEditor((prev) => !prev)}
              className="w-full rounded-xl border border-divider bg-card-elevated px-4 py-3 text-left transition hover:border-accent/40"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-100">Change Password</p>
                    <p className="text-xs text-slate-400">Keep your account secure</p>
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 text-muted transition ${showPasswordEditor ? 'rotate-90' : ''}`} />
              </div>
            </button>

            {showPasswordEditor && (
              <div className="rounded-xl border border-divider bg-card-elevated p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="new-password" className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
                      New Password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full rounded-lg border border-divider bg-card px-3 py-2.5 text-sm text-white placeholder:text-muted"
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
                      Confirm Password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full rounded-lg border border-divider bg-card px-3 py-2.5 text-sm text-white placeholder:text-muted"
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  className="mt-3 w-full rounded-lg border border-divider bg-card px-4 py-2.5 text-sm font-semibold text-white transition hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {changingPassword ? 'Changing...' : 'Update Password'}
                </button>

                {passwordError && (
                  <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-200">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2 text-xs text-emerald-200">
                    {passwordSuccess}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-divider bg-card p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-rose-500/20 p-2 text-rose-300 ring-1 ring-rose-400/30">
                <LogOut className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white sm:text-2xl">Log Out</h3>
                <p className="text-sm text-muted">Sign out of your account on this device.</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full rounded-xl border border-divider bg-card-elevated px-5 py-2.5 text-sm font-semibold text-white transition hover:border-accent/40 sm:w-auto"
            >
              Log Out
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-red-500/20 p-2 text-red-300 ring-1 ring-red-400/30">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-red-300 sm:text-2xl">Delete Account</h3>
                <p className="text-sm text-red-100/80">Permanently delete your account and all associated data. This cannot be undone.</p>
              </div>
            </div>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400 sm:w-auto"
            >
              Delete Account
            </button>
          </div>

          {deleteError && (
            <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-200">
              {deleteError}
            </div>
          )}
        </section>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-divider bg-card-elevated p-6 shadow-xl">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-xl bg-red-500/20 p-2">
                <Trash2 className="h-5 w-5 text-red-300" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Account</h3>
            </div>
            <p className="mb-5 text-sm text-muted">
              This will permanently delete your account and all of your data - animals, care tasks, logs, and settings. <strong>This action cannot be undone.</strong>
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError(null);
                }}
                disabled={deletingAccount}
                className="flex-1 rounded-lg border border-divider bg-card px-4 py-2 text-sm text-white transition hover:border-accent/40 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingAccount ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
