import { supabase } from '../lib/supabase';

export interface OwnerMetric {
  key: string;
  label: string;
  value: number | null;
  error?: string;
}

export interface RecentProfile {
  id: string;
  display_name?: string | null;
  is_premium?: boolean | null;
  subscription_status?: string | null;
  created_at?: string | null;
  email?: string | null;
  last_sign_in_at?: string | null;
}

export interface OwnerDashboardData {
  metrics: OwnerMetric[];
  recentProfiles: RecentProfile[];
  recentProfilesError?: string;
  fetchedAt: string;
}

export interface OwnerSurveyDistribution {
  label: string;
  count: number;
}

export interface OwnerSurveyTimelinePoint {
  date: string;
  count: number;
}

export interface OwnerSurveyResponse {
  id: string;
  userId: string;
  heardAboutUs: string;
  keeperLevel: string;
  primaryGoal: string;
  biggestChallenge: string;
  requestedFeature: string;
  satisfactionScore: number;
  animalsSelected: string[];
  additionalFeedback: string | null;
  createdAt: string;
}

export interface OwnerSurveyAnalytics {
  summary: {
    totalResponses: number;
    averageSatisfaction: number | null;
    last7Days: number;
    last30Days: number;
    withAdditionalFeedback: number;
  };
  satisfactionDistribution: OwnerSurveyDistribution[];
  heardAboutUs: OwnerSurveyDistribution[];
  keeperLevel: OwnerSurveyDistribution[];
  primaryGoal: OwnerSurveyDistribution[];
  biggestChallenge: OwnerSurveyDistribution[];
  requestedFeature: OwnerSurveyDistribution[];
  animalsSelected: OwnerSurveyDistribution[];
  timeline: OwnerSurveyTimelinePoint[];
  recentResponses: OwnerSurveyResponse[];
}

export interface OwnerUserProfileDetail {
  id: string;
  display_name?: string | null;
  is_premium?: boolean | null;
  subscription_status?: string | null;
  created_at?: string | null;
  email?: string | null;
  last_sign_in_at?: string | null;
}

export interface OwnerUserEnclosure {
  id: string;
  name?: string | null;
  animal_name?: string | null;
  created_at?: string | null;
  is_active?: boolean | null;
}

export interface OwnerUserAnimal {
  id: string;
  name?: string | null;
  animal_number?: number | null;
  enclosure_id?: string | null;
  created_at?: string | null;
  is_active?: boolean | null;
}

export interface OwnerUserTask {
  id: string;
  title?: string | null;
  type?: string | null;
  frequency?: string | null;
  next_due_at?: string | null;
  is_active?: boolean | null;
  enclosure_id?: string | null;
  enclosure_animal_id?: string | null;
  created_at?: string | null;
}

export interface OwnerUserDetails {
  selectedUser: OwnerUserProfileDetail | null;
  selectedUserError?: string;
  userDetails: {
    enclosures: OwnerUserEnclosure[];
    animals: OwnerUserAnimal[];
    tasks: OwnerUserTask[];
  };
  userDetailsErrors?: {
    enclosures?: string;
    animals?: string;
    tasks?: string;
  };
  fetchedAt: string;
}

interface OwnerAppStatsResponse {
  metrics?: OwnerMetric[];
  recentProfiles?: RecentProfile[];
  recentProfilesError?: string;
  surveyAnalytics?: OwnerSurveyAnalytics;
  selectedUser?: OwnerUserProfileDetail | null;
  selectedUserError?: string;
  userDetails?: {
    enclosures?: OwnerUserEnclosure[];
    animals?: OwnerUserAnimal[];
    tasks?: OwnerUserTask[];
  };
  userDetailsErrors?: {
    enclosures?: string;
    animals?: string;
    tasks?: string;
  };
  fetchedAt?: string;
  error?: string;
}

function isDevOwnerEdgeFunctionFailure(error: unknown): boolean {
  if (!import.meta.env.DEV) return false;
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes('non-2xx') ||
    message.includes('forbidden') ||
    message.includes('unauthorized') ||
    message.includes('failed to fetch')
  );
}

function getDevFallbackMessage(): string {
  return 'Local fallback: owner edge-function access is not configured (OWNER_EMAILS / OWNER_USER_IDS).';
}

class OwnerDashboardService {
  async getDashboardData(options?: { includeAllProfiles?: boolean }): Promise<OwnerDashboardData> {
    try {
      const { data, error } = await supabase.functions.invoke<OwnerAppStatsResponse>('owner-app-stats', {
        body: { includeAllProfiles: options?.includeAllProfiles ?? false },
      });

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from owner-app-stats function.');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return {
        metrics: data.metrics ?? [],
        recentProfiles: data.recentProfiles ?? [],
        recentProfilesError: data.recentProfilesError,
        fetchedAt: data.fetchedAt ?? new Date().toISOString(),
      };
    } catch (error) {
      if (isDevOwnerEdgeFunctionFailure(error)) {
        return {
          metrics: [],
          recentProfiles: [],
          recentProfilesError: getDevFallbackMessage(),
          fetchedAt: new Date().toISOString(),
        };
      }

      throw error;
    }
  }

  async getUserDetails(userId: string): Promise<OwnerUserDetails> {
    try {
      const { data, error } = await supabase.functions.invoke<OwnerAppStatsResponse>('owner-app-stats', {
        body: { userId },
      });

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from owner-app-stats function.');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return {
        selectedUser: data.selectedUser ?? null,
        selectedUserError: data.selectedUserError,
        userDetails: {
          enclosures: data.userDetails?.enclosures ?? [],
          animals: data.userDetails?.animals ?? [],
          tasks: data.userDetails?.tasks ?? [],
        },
        userDetailsErrors: data.userDetailsErrors,
        fetchedAt: data.fetchedAt ?? new Date().toISOString(),
      };
    } catch (error) {
      if (isDevOwnerEdgeFunctionFailure(error)) {
        return {
          selectedUser: null,
          selectedUserError: getDevFallbackMessage(),
          userDetails: {
            enclosures: [],
            animals: [],
            tasks: [],
          },
          userDetailsErrors: {
            enclosures: getDevFallbackMessage(),
            animals: getDevFallbackMessage(),
            tasks: getDevFallbackMessage(),
          },
          fetchedAt: new Date().toISOString(),
        };
      }

      throw error;
    }
  }

  async getSurveyAnalytics(): Promise<OwnerSurveyAnalytics> {
    try {
      const { data, error } = await supabase.functions.invoke<OwnerAppStatsResponse>('owner-app-stats', {
        body: { surveyAnalytics: true },
      });

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from owner-app-stats function.');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.surveyAnalytics) {
        throw new Error('Survey analytics were not returned from owner-app-stats.');
      }

      return data.surveyAnalytics;
    } catch (error) {
      if (isDevOwnerEdgeFunctionFailure(error)) {
        return {
          summary: {
            totalResponses: 0,
            averageSatisfaction: null,
            last7Days: 0,
            last30Days: 0,
            withAdditionalFeedback: 0,
          },
          satisfactionDistribution: [],
          heardAboutUs: [],
          keeperLevel: [],
          primaryGoal: [],
          biggestChallenge: [],
          requestedFeature: [],
          animalsSelected: [],
          timeline: [],
          recentResponses: [],
        };
      }

      throw error;
    }
  }
}

export const ownerDashboardService = new OwnerDashboardService();