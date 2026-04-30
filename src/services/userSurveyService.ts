import { supabase } from '../lib/supabase';

export interface UserSurveyInput {
  heardAboutUs: string;
  keeperLevel: string;
  animalsSelected: string[];
  primaryGoal: string;
  biggestChallenge: string;
  requestedFeature: string;
  satisfactionScore: number;
  additionalFeedback?: string;
}

export interface IUserSurveyService {
  hasCompleted(userId: string): Promise<boolean>;
  submitSurvey(userId: string, input: UserSurveyInput): Promise<void>;
}

class SupabaseUserSurveyService implements IUserSurveyService {
  async hasCompleted(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_feedback_surveys')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return Boolean(data?.id);
  }

  async submitSurvey(userId: string, input: UserSurveyInput): Promise<void> {
    const { error } = await supabase
      .from('user_feedback_surveys')
      .insert({
        user_id: userId,
        heard_about_us: input.heardAboutUs,
        keeper_level: input.keeperLevel,
        animals_selected: input.animalsSelected,
        primary_goal: input.primaryGoal,
        biggest_challenge: input.biggestChallenge,
        requested_feature: input.requestedFeature,
        satisfaction_score: input.satisfactionScore,
        additional_feedback: input.additionalFeedback || null,
      });

    if (error) {
      throw error;
    }
  }
}

export const userSurveyService = new SupabaseUserSurveyService();
