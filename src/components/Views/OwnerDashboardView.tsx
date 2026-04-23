import { useCallback, useEffect, useState, type ComponentType } from 'react';
import { RefreshCw, Users, Gem, Activity, Clock3, AlertCircle, CreditCard } from 'lucide-react';
import {
  ownerDashboardService,
  type OwnerDashboardData,
  type OwnerUserDetails,
} from '../../services/ownerDashboardService';

const metricStyles: Record<string, { icon: ComponentType<{ className?: string }>; accent: string; iconBg: string }> = {
  totalProfiles: { icon: Users, accent: 'text-sky-700 dark:text-sky-300', iconBg: 'bg-sky-100 dark:bg-sky-900/30' },
  premiumUsers: { icon: Gem, accent: 'text-emerald-700 dark:text-emerald-300', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  activeSubscriptions: { icon: Activity, accent: 'text-green-700 dark:text-green-300', iconBg: 'bg-green-100 dark:bg-green-900/30' },
  trialingSubscriptions: { icon: Clock3, accent: 'text-indigo-700 dark:text-indigo-300', iconBg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  canceledSubscriptions: { icon: AlertCircle, accent: 'text-red-700 dark:text-red-300', iconBg: 'bg-red-100 dark:bg-red-900/30' },
  pendingCancellation: { icon: AlertCircle, accent: 'text-amber-700 dark:text-amber-300', iconBg: 'bg-amber-100 dark:bg-amber-900/30' },
  stripeCustomers: { icon: CreditCard, accent: 'text-violet-700 dark:text-violet-300', iconBg: 'bg-violet-100 dark:bg-violet-900/30' },
};

export function OwnerDashboardView() {
  const [data, setData] = useState<OwnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllProfiles, setShowAllProfiles] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<OwnerUserDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const loadData = useCallback(async (includeAllProfiles: boolean = showAllProfiles) => {
    try {
      setLoading(true);
      setError(null);
      const dashboardData = await ownerDashboardService.getDashboardData({ includeAllProfiles });
      setData(dashboardData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error loading dashboard data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [showAllProfiles]);

  const toggleProfileScope = async () => {
    const next = !showAllProfiles;
    setShowAllProfiles(next);
    await loadData(next);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleProfileClick = useCallback(async (profileId: string) => {
    try {
      setSelectedProfileId(profileId);
      setDetailsLoading(true);
      setDetailsError(null);
      const details = await ownerDashboardService.getUserDetails(profileId);
      setSelectedUserDetails(details);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error loading user details';
      setDetailsError(message);
      setSelectedUserDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Owner Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">App-wide profile and subscription snapshot.</p>
        </div>
        <button
          onClick={() => loadData()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 rounded-lg p-4">
          Failed to load dashboard data: {error}
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4">
        {(data?.metrics ?? []).map((metric) => (
          <div key={metric.key} className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{metric.label}</p>
                <p className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mt-1.5 sm:mt-2 leading-none">
                  {metric.value === null ? 'N/A' : metric.value.toLocaleString()}
                </p>
              </div>
              <div className={`p-2 sm:p-2.5 rounded-lg ${metricStyles[metric.key]?.iconBg ?? 'bg-gray-100 dark:bg-gray-700'}`}>
                {(() => {
                  const Icon = metricStyles[metric.key]?.icon ?? Users;
                  return <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${metricStyles[metric.key]?.accent ?? 'text-gray-600 dark:text-gray-300'}`} />;
                })()}
              </div>
            </div>
            <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700/80">
              {metric.error ? (
                <p className="text-xs text-amber-700 dark:text-amber-300">{metric.error}</p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">Updated from edge function data</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">All Profiles</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleProfileScope}
              disabled={loading}
              className="text-xs px-2.5 py-1 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60"
            >
              {showAllProfiles ? 'Show latest 10' : 'Show all'}
            </button>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              {(data?.recentProfiles.length ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
        {data?.recentProfilesError && (
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">{data.recentProfilesError}</p>
        )}
        {!data?.recentProfiles.length ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">No profiles returned.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.recentProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleProfileClick(profile.id)}
                className={`text-left rounded-lg border-2 p-3 sm:p-4 transition-colors ${selectedProfileId === profile.id ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20 hover:border-gray-300 dark:hover:border-gray-600'}`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white truncate text-sm sm:text-base">{profile.display_name || 'Unnamed'}</div>
                  </div>
                  <span className={`flex-shrink-0 text-[10px] sm:text-xs px-2 py-1 rounded-full font-medium ${profile.is_premium ? 'bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-gray-200/80 dark:bg-gray-600/40 text-gray-700 dark:text-gray-300'}`}>
                    {profile.is_premium ? 'Premium' : 'Free'}
                  </span>
                </div>
                
                <div className="space-y-2 text-xs sm:text-sm">
                  {profile.email && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 w-20">Email:</span>
                      <span className="text-gray-900 dark:text-gray-200 truncate">{profile.email}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 w-20">Sub:</span>
                    <span className="text-gray-900 dark:text-gray-200 font-medium">{profile.subscription_status || 'unknown'}</span>
                  </div>
                  {profile.created_at && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 w-20">Created:</span>
                      <span className="text-gray-900 dark:text-gray-200">{new Date(profile.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {profile.last_sign_in_at && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 w-20">Last Seen:</span>
                      <span className="text-gray-900 dark:text-gray-200">{new Date(profile.last_sign_in_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">Selected User Details</h2>

        {!selectedProfileId && (
          <p className="text-sm text-gray-600 dark:text-gray-400">Click a profile above to view enclosures, animals, and tasks.</p>
        )}

        {detailsLoading && (
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading selected user details...</p>
        )}

        {detailsError && (
          <p className="text-sm text-red-700 dark:text-red-300">Failed to load details: {detailsError}</p>
        )}

        {selectedUserDetails && !detailsLoading && !detailsError && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2.5 sm:p-3 bg-gray-50/70 dark:bg-gray-700/30">
              <div className="font-medium text-gray-900 dark:text-white">
                {selectedUserDetails.selectedUser?.display_name || selectedUserDetails.selectedUser?.id || selectedProfileId}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {selectedUserDetails.selectedUser?.is_premium ? 'Premium' : 'Free'}
                {selectedUserDetails.selectedUser?.subscription_status ? ` • ${selectedUserDetails.selectedUser.subscription_status}` : ''}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2.5 sm:p-3">
                <div className="font-medium text-gray-900 dark:text-white mb-2">Enclosures ({selectedUserDetails.userDetails.enclosures.length})</div>
                {selectedUserDetails.userDetailsErrors?.enclosures && (
                  <div className="text-xs text-amber-700 dark:text-amber-300 mb-2">{selectedUserDetails.userDetailsErrors.enclosures}</div>
                )}
                <div className="space-y-2 max-h-52 sm:max-h-64 overflow-auto">
                  {selectedUserDetails.userDetails.enclosures.map((enclosure) => (
                    <div key={enclosure.id} className="text-xs rounded bg-gray-50 dark:bg-gray-700/50 p-2">
                      <div className="font-medium text-gray-800 dark:text-gray-200">{enclosure.name || enclosure.id}</div>
                      <div className="text-gray-500 dark:text-gray-400">{enclosure.animal_name || 'Unknown species'}</div>
                    </div>
                  ))}
                  {selectedUserDetails.userDetails.enclosures.length === 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">No enclosures found.</div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2.5 sm:p-3">
                <div className="font-medium text-gray-900 dark:text-white mb-2">Animals ({selectedUserDetails.userDetails.animals.length})</div>
                {selectedUserDetails.userDetailsErrors?.animals && (
                  <div className="text-xs text-amber-700 dark:text-amber-300 mb-2">{selectedUserDetails.userDetailsErrors.animals}</div>
                )}
                <div className="space-y-2 max-h-52 sm:max-h-64 overflow-auto">
                  {selectedUserDetails.userDetails.animals.map((animal) => (
                    <div key={animal.id} className="text-xs rounded bg-gray-50 dark:bg-gray-700/50 p-2">
                      <div className="font-medium text-gray-800 dark:text-gray-200">{animal.name || `Animal #${animal.animal_number ?? 'n/a'}`}</div>
                      <div className="text-gray-500 dark:text-gray-400">Enclosure: {animal.enclosure_id || 'Unassigned'}</div>
                    </div>
                  ))}
                  {selectedUserDetails.userDetails.animals.length === 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">No animals found.</div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2.5 sm:p-3">
                <div className="font-medium text-gray-900 dark:text-white mb-2">Tasks ({selectedUserDetails.userDetails.tasks.length})</div>
                {selectedUserDetails.userDetailsErrors?.tasks && (
                  <div className="text-xs text-amber-700 dark:text-amber-300 mb-2">{selectedUserDetails.userDetailsErrors.tasks}</div>
                )}
                <div className="space-y-2 max-h-52 sm:max-h-64 overflow-auto">
                  {selectedUserDetails.userDetails.tasks.map((task) => (
                    <div key={task.id} className="text-xs rounded bg-gray-50 dark:bg-gray-700/50 p-2">
                      <div className="font-medium text-gray-800 dark:text-gray-200">{task.title || task.id}</div>
                      <div className="text-gray-500 dark:text-gray-400">{task.type || 'custom'} • {task.frequency || 'unknown'}</div>
                    </div>
                  ))}
                  {selectedUserDetails.userDetails.tasks.length === 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">No tasks found.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        Last updated: {data?.fetchedAt ? new Date(data.fetchedAt).toLocaleString() : 'Not loaded'}
      </div>
    </div>
  );
}