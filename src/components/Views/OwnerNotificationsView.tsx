import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, RefreshCw, Send, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ownerDashboardService, type OwnerDashboardData } from '../../services/ownerDashboardService';
import { OwnerSectionNav } from '../OwnerDashboard/OwnerSectionNav';

async function getEdgeFunctionErrorMessage(error: unknown): Promise<string> {
  if (!(error instanceof Error)) return 'Failed to send notification.';

  const baseMessage = error.message || 'Failed to send notification.';
  const errorWithContext = error as Error & { context?: Response };
  const response = errorWithContext.context;

  if (!response) return baseMessage;

  try {
    const body = await response.clone().json() as { error?: string; message?: string };
    const details = body?.error || body?.message;
    if (details) return `${baseMessage}: ${details}`;
  } catch {
    // Ignore JSON parse failures and fallback to status text.
  }

  return `${baseMessage} (${response.status} ${response.statusText || 'Error'})`;
}

export function OwnerNotificationsView() {
  const MAX_BROADCAST_TITLE_LENGTH = 100;
  const MAX_BROADCAST_MESSAGE_LENGTH = 300;

  const [dashboardData, setDashboardData] = useState<OwnerDashboardData | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [showAllProfiles, setShowAllProfiles] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastUrl, setBroadcastUrl] = useState('/');
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'user'>('all');
  const [broadcastUserId, setBroadcastUserId] = useState('');
  const [confirmBroadcastAll, setConfirmBroadcastAll] = useState(false);
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{
    ok: boolean;
    message: string;
    stats?: { webSent: number; webExpired: number; nativeSent: number; nativeExpired: number; nativeFailed: number };
  } | null>(null);

  const broadcastTitleTrimmed = broadcastTitle.trim();
  const broadcastMessageTrimmed = broadcastMessage.trim();
  const broadcastUserIdTrimmed = broadcastUserId.trim();
  const broadcastUrlTrimmed = broadcastUrl.trim();

  const normalizedBroadcastUrl = useMemo(() => {
    if (!broadcastUrlTrimmed) return '/';
    if (broadcastUrlTrimmed.startsWith('/')) return broadcastUrlTrimmed;
    if (broadcastUrlTrimmed.startsWith('http://') || broadcastUrlTrimmed.startsWith('https://')) return broadcastUrlTrimmed;
    return `/${broadcastUrlTrimmed}`;
  }, [broadcastUrlTrimmed]);

  const isInvalidBroadcastUrl = Boolean(
    broadcastUrlTrimmed &&
      !broadcastUrlTrimmed.startsWith('/') &&
      !broadcastUrlTrimmed.startsWith('http://') &&
      !broadcastUrlTrimmed.startsWith('https://')
  );

  const canSendBroadcast =
    Boolean(broadcastTitleTrimmed) &&
    Boolean(broadcastMessageTrimmed) &&
    !isInvalidBroadcastUrl &&
    (broadcastTarget === 'all' ? confirmBroadcastAll : Boolean(broadcastUserIdTrimmed));

  const devSendBlockedReason = useMemo(() => {
    if (!import.meta.env.DEV) return null;
    if (!dashboardData?.recentProfilesError?.toLowerCase().includes('local fallback')) return null;

    return 'Sending is disabled locally because edge-function owner secrets are not configured. Set OWNER_USER_IDS or OWNER_EMAILS in Supabase secrets for this project.';
  }, [dashboardData?.recentProfilesError]);

  const loadProfiles = useCallback(async (includeAllProfiles: boolean = showAllProfiles) => {
    try {
      setLoadingProfiles(true);
      setProfilesError(null);
      const data = await ownerDashboardService.getDashboardData({ includeAllProfiles });
      setDashboardData(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error loading profile list';
      setProfilesError(message);
    } finally {
      setLoadingProfiles(false);
    }
  }, [showAllProfiles]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const applyBroadcastTemplate = useCallback((template: { title: string; message: string; url: string }) => {
    setBroadcastTitle(template.title);
    setBroadcastMessage(template.message);
    setBroadcastUrl(template.url);
    setBroadcastResult(null);
  }, []);

  const toggleProfileScope = async () => {
    const next = !showAllProfiles;
    setShowAllProfiles(next);
    await loadProfiles(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
            <Bell className="h-4 w-4" />
            Owner Dashboard
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Push Notifications</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Send announcements to all subscribers or target a specific user account from a dedicated notifications workspace.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadProfiles()}
            disabled={loadingProfiles}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 ${loadingProfiles ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <OwnerSectionNav />

      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-100">Recent profiles for quick targeting</h2>
          <p className="text-sm text-amber-800/90 dark:text-amber-200/80">Click a user below to prefill the specific-user target field.</p>
        </div>
        <button
          onClick={toggleProfileScope}
          disabled={loadingProfiles}
          className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {showAllProfiles ? 'Show latest 10' : 'Show all profiles'}
        </button>
      </div>

      {profilesError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          Failed to load profiles: {profilesError}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Target Picker</h2>
          <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            <Users className="h-3.5 w-3.5" />
            {(dashboardData?.recentProfiles.length ?? 0).toLocaleString()} loaded
          </div>
        </div>

        {dashboardData?.recentProfilesError && (
          <p className="mb-3 text-sm text-amber-700 dark:text-amber-300">{dashboardData.recentProfilesError}</p>
        )}

        {!dashboardData?.recentProfiles.length ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">No profiles available for quick selection.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {dashboardData.recentProfiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => {
                  setBroadcastTarget('user');
                  setBroadcastUserId(profile.id);
                  setBroadcastResult(null);
                }}
                className={`rounded-lg border p-3 text-left transition-colors ${broadcastTarget === 'user' && broadcastUserIdTrimmed === profile.id ? 'border-emerald-400 bg-emerald-50/60 dark:border-emerald-500 dark:bg-emerald-900/20' : 'border-gray-200 bg-gray-50/60 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-700/20 dark:hover:border-gray-600'}`}
              >
                <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">{profile.display_name || 'Unnamed user'}</div>
                <div className="mt-1 truncate text-xs text-gray-600 dark:text-gray-400">{profile.email || profile.id}</div>
                <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">{profile.subscription_status || 'unknown'} {profile.is_premium ? '• Premium' : '• Free'}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center gap-2">
          <Send className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Compose Notification</h2>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!canSendBroadcast || devSendBlockedReason) return;
            setBroadcastSending(true);
            setBroadcastResult(null);
            try {
              const { data: result, error } = await supabase.functions.invoke('send-broadcast-notification', {
                body: {
                  title: broadcastTitleTrimmed,
                  message: broadcastMessageTrimmed,
                  url: normalizedBroadcastUrl,
                  ...(broadcastTarget === 'user' && broadcastUserIdTrimmed ? { targetUserId: broadcastUserIdTrimmed } : {}),
                },
              });

              if (error) throw error;

              const s = result?.stats;
              const stats = {
                webSent: s?.webSent ?? 0,
                webExpired: s?.webExpired ?? 0,
                nativeSent: s?.nativeSent ?? 0,
                nativeExpired: s?.nativeExpired ?? 0,
                nativeFailed: s?.nativeFailed ?? 0,
              };
              const totalDelivered = stats.webSent + stats.nativeSent;

              setBroadcastResult({
                ok: totalDelivered > 0,
                message:
                  totalDelivered > 0
                    ? `Notification delivered to ${totalDelivered.toLocaleString()} subscription${totalDelivered === 1 ? '' : 's'}.`
                    : 'Request completed, but no active subscriptions received the notification.',
                stats,
              });

              setBroadcastTitle('');
              setBroadcastMessage('');
              setConfirmBroadcastAll(false);
            } catch (error) {
              const message = await getEdgeFunctionErrorMessage(error);
              setBroadcastResult({ ok: false, message });
            } finally {
              setBroadcastSending(false);
            }
          }}
          className="space-y-3"
        >
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-800 dark:bg-amber-900/20">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-100">Quick templates</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyBroadcastTemplate({
                  title: 'Care Reminder',
                  message: 'Quick reminder: open your Care Calendar to review tasks due today.',
                  url: '/care-calendar',
                })}
                className="rounded-full border border-amber-300 px-2.5 py-1.5 text-xs text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40"
              >
                Care reminder
              </button>
              <button
                type="button"
                onClick={() => applyBroadcastTemplate({
                  title: 'New Feature Available',
                  message: 'A new Habitat Builder feature is now live. Tap to check it out.',
                  url: '/roadmap',
                })}
                className="rounded-full border border-amber-300 px-2.5 py-1.5 text-xs text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40"
              >
                Feature update
              </button>
              <button
                type="button"
                onClick={() => applyBroadcastTemplate({
                  title: 'We would love your feedback',
                  message: 'Help us improve Habitat Builder by sharing your experience in a short survey.',
                  url: '/feedback-survey',
                })}
                className="rounded-full border border-amber-300 px-2.5 py-1.5 text-xs text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40"
              >
                Feedback request
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="radio"
                name="target"
                checked={broadcastTarget === 'all'}
                onChange={() => {
                  setBroadcastTarget('all');
                  setBroadcastResult(null);
                }}
                className="accent-emerald-600"
              />
              All subscribers
            </label>
            <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="radio"
                name="target"
                checked={broadcastTarget === 'user'}
                onChange={() => {
                  setBroadcastTarget('user');
                  setBroadcastResult(null);
                }}
                className="accent-emerald-600"
              />
              Specific user
            </label>
          </div>

          {broadcastTarget === 'all' && (
            <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/50 p-2.5 text-xs text-gray-700 dark:border-amber-800 dark:bg-amber-950/20 dark:text-gray-300">
              <input
                type="checkbox"
                checked={confirmBroadcastAll}
                onChange={(e) => {
                  setConfirmBroadcastAll(e.target.checked);
                  setBroadcastResult(null);
                }}
                className="mt-0.5 accent-amber-600"
              />
              <span>I understand this sends to all current push subscribers.</span>
            </label>
          )}

          {broadcastTarget === 'user' && (
            <input
              type="text"
              placeholder="User ID (or click a profile in the target picker)"
              value={broadcastUserId}
              onChange={(e) => {
                setBroadcastUserId(e.target.value);
                setBroadcastResult(null);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              required
            />
          )}

          <div className="space-y-1">
            <input
              type="text"
              placeholder="Title"
              value={broadcastTitle}
              onChange={(e) => {
                setBroadcastTitle(e.target.value);
                setBroadcastResult(null);
              }}
              maxLength={MAX_BROADCAST_TITLE_LENGTH}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              required
            />
            <div className="text-right text-[11px] text-gray-500 dark:text-gray-400">{broadcastTitle.length}/{MAX_BROADCAST_TITLE_LENGTH}</div>
          </div>

          <div className="space-y-1">
            <textarea
              placeholder="Message body"
              value={broadcastMessage}
              onChange={(e) => {
                setBroadcastMessage(e.target.value);
                setBroadcastResult(null);
              }}
              maxLength={MAX_BROADCAST_MESSAGE_LENGTH}
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              required
            />
            <div className="text-right text-[11px] text-gray-500 dark:text-gray-400">{broadcastMessage.length}/{MAX_BROADCAST_MESSAGE_LENGTH}</div>
          </div>

          <div className="space-y-1">
            <input
              type="text"
              placeholder="Deep-link URL (e.g. /care-calendar)"
              value={broadcastUrl}
              onChange={(e) => {
                setBroadcastUrl(e.target.value);
                setBroadcastResult(null);
              }}
              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white ${isInvalidBroadcastUrl ? 'border-amber-400 dark:border-amber-500' : 'border-gray-300 dark:border-gray-600'}`}
            />
            <div className="text-[11px] text-gray-500 dark:text-gray-400">
              {isInvalidBroadcastUrl ? 'Tip: URL should start with / or use https://' : `Will open: ${normalizedBroadcastUrl}`}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 dark:border-gray-700 dark:bg-gray-700/30">
            <div className="mb-1 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Preview</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">{broadcastTitleTrimmed || 'Notification title'}</div>
            <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">{broadcastMessageTrimmed || 'Notification message preview appears here.'}</div>
            <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">Target: {broadcastTarget === 'all' ? 'All subscribers' : broadcastUserIdTrimmed || 'Specific user (not set)'}</div>
          </div>

          <button
            type="submit"
            disabled={broadcastSending || !canSendBroadcast || Boolean(devSendBlockedReason)}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:bg-gray-400"
          >
            <Send className="h-3.5 w-3.5" />
            {broadcastSending ? 'Sending...' : 'Send Notification'}
          </button>

          {devSendBlockedReason && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              <div className="mb-1 font-semibold">Send blocked in local dev</div>
              <div>{devSendBlockedReason}</div>
              <div className="mt-2">Run:</div>
              <div className="mt-1 font-mono">npx supabase secrets set OWNER_USER_IDS=your-supabase-user-id</div>
              <div className="font-mono">npx supabase secrets set OWNER_EMAILS=your@email.com</div>
            </div>
          )}
        </form>

        {broadcastResult && (
          <div className={`mt-3 rounded-lg p-3 text-sm ${broadcastResult.ok ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200' : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200'}`}>
            <div>{broadcastResult.message}</div>
            {broadcastResult.stats && (
              <div className="mt-2 space-y-1 text-xs">
                <div>Delivered: web {broadcastResult.stats.webSent}, native {broadcastResult.stats.nativeSent}</div>
                <div>Expired cleaned up: web {broadcastResult.stats.webExpired}, native {broadcastResult.stats.nativeExpired}</div>
                {broadcastResult.stats.nativeFailed > 0 && <div>Native failures: {broadcastResult.stats.nativeFailed}</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
