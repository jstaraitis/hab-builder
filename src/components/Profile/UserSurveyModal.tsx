import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import type { UserSurveyInput } from '../../services/userSurveyService';

interface UserSurveyFormProps {
  submitting: boolean;
  onSubmit: (input: UserSurveyInput) => Promise<void>;
}

const heardAboutUsOptions = [
  'YouTube',
  'TikTok',
  'Reddit',
  'Facebook Group',
  'Discord',
  'Google Search',
  'Friend or Word of Mouth',
  'App Store Search',
  'Other',
] as const;

const keeperLevelOptions = [
  'New keeper',
  'Intermediate keeper',
  'Experienced keeper',
  'Parent helping child',
  'Educator or rescue',
] as const;

const animalOptions = [
  "White's Tree Frog",
  'Crested Gecko',
  'Leopard Gecko',
  'Bearded Dragon',
  'Ball Python',
  'Corn Snake',
  'Axolotl',
  'Other',
] as const;

const primaryGoalOptions = [
  'Set up first enclosure',
  'Improve existing setup',
  'Care schedule and reminders',
  'Track health and weight',
  'Shopping and equipment planning',
  'Compare species needs',
] as const;

const challengeOptions = [
  'Unsure if enclosure setup is correct',
  'Hard to stay consistent with tasks',
  'Too many reminders or not enough reminders',
  'Hard to find the right equipment',
  'Missing species or care guidance',
  'Other',
] as const;

const featureOptions = [
  'Better reminder controls',
  'More species guides',
  'Smarter analytics insights',
  'Export or share plan',
  'Better health log workflows',
  'Inventory automation',
] as const;

export function UserSurveyForm({ submitting, onSubmit }: Readonly<UserSurveyFormProps>) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<UserSurveyInput>({
    heardAboutUs: '',
    keeperLevel: '',
    animalsSelected: [],
    primaryGoal: '',
    biggestChallenge: '',
    requestedFeature: '',
    satisfactionScore: 4,
    additionalFeedback: '',
  });
  const [customChallenge, setCustomChallenge] = useState('');
  const [customFeature, setCustomFeature] = useState('');
  const [error, setError] = useState<string | null>(null);

  const toggleAnimal = (animal: string) => {
    setForm((prev) => ({
      ...prev,
      animalsSelected: prev.animalsSelected.includes(animal)
        ? prev.animalsSelected.filter((item) => item !== animal)
        : [...prev.animalsSelected, animal],
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.heardAboutUs || !form.primaryGoal || !form.biggestChallenge || !form.requestedFeature || !form.keeperLevel) {
      setError('Please complete all required questions before submitting.');
      return;
    }
    if (form.biggestChallenge === 'Other' && !customChallenge.trim()) {
      setError('Please describe your biggest challenge.');
      return;
    }
    if (form.requestedFeature === 'Other' && !customFeature.trim()) {
      setError('Please describe the feature you need.');
      return;
    }

    const submittedForm = {
      ...form,
      biggestChallenge: form.biggestChallenge === 'Other' ? customChallenge.trim() : form.biggestChallenge,
      requestedFeature: form.requestedFeature === 'Other' ? customFeature.trim() : form.requestedFeature,
    };

    try {
      await onSubmit(submittedForm);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit survey.';
      setError(message);
    }
  };

  return (
    <section className="rounded-2xl border border-cyan-500/30 bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-cyan-500/20 p-2.5 text-cyan-300 ring-1 ring-cyan-400/30">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Quick Product Survey</h3>
          </div>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-dim sm:w-auto"
          >
            Take 2-minute survey
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-slate-200">Where did you hear about us? *</span>
          <select
            value={form.heardAboutUs}
            onChange={(e) => setForm((prev) => ({ ...prev, heardAboutUs: e.target.value }))}
            className="w-full rounded-lg border border-divider bg-card-elevated px-3 py-2.5 text-white"
            required
          >
            <option value="">Select one</option>
            {heardAboutUsOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-200">What best describes you? *</span>
          <select
            value={form.keeperLevel}
            onChange={(e) => setForm((prev) => ({ ...prev, keeperLevel: e.target.value }))}
            className="w-full rounded-lg border border-divider bg-card-elevated px-3 py-2.5 text-white"
            required
          >
            <option value="">Select one</option>
            {keeperLevelOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className="mb-2 text-sm text-slate-200">Which animals are you planning or caring for?</legend>
          <div className="grid grid-cols-2 gap-2">
            {animalOptions.map((animal) => (
              <label key={animal} className="flex items-center gap-2 rounded-lg border border-divider bg-card-elevated px-2.5 py-2 text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={form.animalsSelected.includes(animal)}
                  onChange={() => toggleAnimal(animal)}
                  className="h-4 w-4"
                />
                {animal}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-200">What is your main reason for using Habitat Builder? *</span>
          <select
            value={form.primaryGoal}
            onChange={(e) => setForm((prev) => ({ ...prev, primaryGoal: e.target.value }))}
            className="w-full rounded-lg border border-divider bg-card-elevated px-3 py-2.5 text-white"
            required
          >
            <option value="">Select one</option>
            {primaryGoalOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <div className="block text-sm">
          <label className="mb-1 block text-slate-200">What is the biggest challenge you still have? *</label>
          <select
            value={form.biggestChallenge}
            onChange={(e) => setForm((prev) => ({ ...prev, biggestChallenge: e.target.value }))}
            className="w-full rounded-lg border border-divider bg-card-elevated px-3 py-2.5 text-white"
            required
          >
            <option value="">Select one</option>
            {challengeOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {form.biggestChallenge === 'Other' && (
            <input
              type="text"
              value={customChallenge}
              onChange={(e) => setCustomChallenge(e.target.value)}
              placeholder="Describe your challenge"
              className="mt-2 w-full rounded-lg border border-divider bg-card-elevated px-3 py-2.5 text-white placeholder:text-muted"
            />
          )}
        </div>

        <div className="block text-sm">
          <label className="mb-1 block text-slate-200">Which feature would help you most next? *</label>
          <select
            value={form.requestedFeature}
            onChange={(e) => setForm((prev) => ({ ...prev, requestedFeature: e.target.value }))}
            className="w-full rounded-lg border border-divider bg-card-elevated px-3 py-2.5 text-white"
            required
          >
            <option value="">Select one</option>
            {featureOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
            <option value="Other">Other (describe below)</option>
          </select>
          {form.requestedFeature === 'Other' && (
            <input
              type="text"
              value={customFeature}
              onChange={(e) => setCustomFeature(e.target.value)}
              placeholder="Describe the feature you need"
              className="mt-2 w-full rounded-lg border border-divider bg-card-elevated px-3 py-2.5 text-white placeholder:text-muted"
            />
          )}
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-200">How satisfied are you so far? ({form.satisfactionScore}/5)</span>
          <input
            type="range"
            min={1}
            max={5}
            value={form.satisfactionScore}
            onChange={(e) => setForm((prev) => ({ ...prev, satisfactionScore: Number(e.target.value) }))}
            className="w-full"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-200">Any additional feedback? (optional)</span>
          <textarea
            value={form.additionalFeedback}
            onChange={(e) => setForm((prev) => ({ ...prev, additionalFeedback: e.target.value }))}
            className="w-full rounded-lg border border-divider bg-card-elevated px-3 py-2.5 text-white"
            rows={3}
            placeholder="Share any ideas or pain points"
          />
        </label>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-200">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-dim disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Survey'}
          </button>
        </div>
      </form>
      )}
    </section>
  );
}
