import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, ClipboardList, MessageSquareQuote, RefreshCw, Star, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ownerDashboardService, type OwnerSurveyAnalytics, type OwnerSurveyDistribution } from '../../services/ownerDashboardService';
import { OwnerSectionNav } from '../OwnerDashboard/OwnerSectionNav';

const cardClassName = 'rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm';

const distributionTitles: Array<{
  key: keyof Pick<OwnerSurveyAnalytics, 'heardAboutUs' | 'keeperLevel' | 'primaryGoal' | 'biggestChallenge' | 'requestedFeature' | 'animalsSelected'>;
  title: string;
  emptyLabel: string;
}> = [
  { key: 'heardAboutUs', title: 'Acquisition sources', emptyLabel: 'No source data yet.' },
  { key: 'keeperLevel', title: 'Keeper experience', emptyLabel: 'No keeper-level data yet.' },
  { key: 'primaryGoal', title: 'Primary goals', emptyLabel: 'No primary-goal data yet.' },
  { key: 'biggestChallenge', title: 'Biggest challenges', emptyLabel: 'No challenge data yet.' },
  { key: 'requestedFeature', title: 'Requested features', emptyLabel: 'No feature-request data yet.' },
  { key: 'animalsSelected', title: 'Animals selected', emptyLabel: 'No animal selections yet.' },
];

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
}: Readonly<{
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}>) {
  const Icon = icon;

  return (
    <div className={cardClassName}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>
        <div className="rounded-lg bg-indigo-100 p-2.5 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function DistributionChart({ title, data, emptyLabel }: Readonly<{ title: string; data: OwnerSurveyDistribution[]; emptyLabel: string }>) {
  const chartData = data.slice(0, 8).map((item) => ({
    ...item,
    shortLabel: item.label.length > 22 ? `${item.label.slice(0, 22)}...` : item.label,
  }));

  return (
    <section className={cardClassName}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">Top {Math.min(chartData.length, 8)}</span>
      </div>
      {!chartData.length ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">{emptyLabel}</p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
              <XAxis type="number" allowDecimals={false} stroke="#94a3b8" />
              <YAxis type="category" dataKey="shortLabel" width={120} stroke="#94a3b8" />
              <Tooltip formatter={(value: number) => [value, 'Responses']} />
              <Bar dataKey="count" fill="#4f46e5" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export function OwnerSurveyAnalyticsView() {
  const [analytics, setAnalytics] = useState<OwnerSurveyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const surveyAnalytics = await ownerDashboardService.getSurveyAnalytics();
      setAnalytics(surveyAnalytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error loading survey analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const feedbackResponses = analytics?.recentResponses.filter((response) => Boolean(response.additionalFeedback?.trim())) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-300">
            <ClipboardList className="h-4 w-4" />
            Owner Dashboard
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Survey Analytics</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Aggregate view of user feedback survey responses across acquisition, satisfaction, roadmap demand, and written feedback.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadAnalytics()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <OwnerSectionNav />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          Failed to load survey analytics: {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total responses"
          value={analytics ? analytics.summary.totalResponses.toLocaleString() : loading ? '...' : '0'}
          subtitle="Completed survey submissions"
          icon={BarChart3}
        />
        <MetricCard
          title="Average satisfaction"
          value={analytics?.summary.averageSatisfaction !== null && analytics?.summary.averageSatisfaction !== undefined ? `${analytics.summary.averageSatisfaction.toFixed(1)}/5` : loading ? '...' : 'N/A'}
          subtitle="Mean satisfaction score across all responses"
          icon={Star}
        />
        <MetricCard
          title="Last 30 days"
          value={analytics ? analytics.summary.last30Days.toLocaleString() : loading ? '...' : '0'}
          subtitle={`Last 7 days: ${analytics?.summary.last7Days ?? 0}`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Written feedback"
          value={analytics ? analytics.summary.withAdditionalFeedback.toLocaleString() : loading ? '...' : '0'}
          subtitle="Responses that include open-text comments"
          icon={MessageSquareQuote}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className={cardClassName}>
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Submission trend</h2>
          {!analytics?.timeline.length ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No submissions yet.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.timeline} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
                  <XAxis dataKey="date" tickFormatter={(value) => formatDate(value)} stroke="#94a3b8" minTickGap={24} />
                  <YAxis allowDecimals={false} stroke="#94a3b8" />
                  <Tooltip labelFormatter={(value) => formatDate(String(value))} formatter={(value: number) => [value, 'Responses']} />
                  <Line type="monotone" dataKey="count" stroke="#0f766e" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className={cardClassName}>
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Satisfaction distribution</h2>
          {!analytics?.satisfactionDistribution.length ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No satisfaction data yet.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.satisfactionDistribution} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis allowDecimals={false} stroke="#94a3b8" />
                  <Tooltip formatter={(value: number) => [value, 'Responses']} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {distributionTitles.map(({ key, title, emptyLabel }) => (
          <DistributionChart
            key={key}
            title={title}
            data={analytics?.[key] ?? []}
            emptyLabel={emptyLabel}
          />
        ))}
      </div>

      <section className={cardClassName}>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent written feedback</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Latest survey responses that included optional comments.</p>
        {!feedbackResponses.length ? (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">No written feedback yet.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {feedbackResponses.slice(0, 8).map((response) => (
              <article key={response.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/30">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{formatDate(response.createdAt)}</span>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    {response.satisfactionScore}/5
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-800 dark:text-gray-200">{response.additionalFeedback}</p>
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  {response.primaryGoal} · {response.requestedFeature}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={cardClassName}>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent submissions</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Latest 12 survey rows for quick spot checks.</p>
        {!analytics?.recentResponses.length ? (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">No survey submissions yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Keeper</th>
                  <th className="px-3 py-2">Goal</th>
                  <th className="px-3 py-2">Feature</th>
                  <th className="px-3 py-2">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {analytics.recentResponses.map((response) => (
                  <tr key={response.id} className="text-gray-700 dark:text-gray-200">
                    <td className="px-3 py-2 whitespace-nowrap">{formatDate(response.createdAt)}</td>
                    <td className="px-3 py-2">{response.heardAboutUs}</td>
                    <td className="px-3 py-2">{response.keeperLevel}</td>
                    <td className="px-3 py-2">{response.primaryGoal}</td>
                    <td className="px-3 py-2">{response.requestedFeature}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{response.satisfactionScore}/5</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}