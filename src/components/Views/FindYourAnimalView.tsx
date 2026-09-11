import { ArrowLeft, AlertCircle, CheckCircle, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, memo } from 'react';
import type { EnclosureInput } from '../../engine/types';
import { recommendAnimals, categorizeRecommendations } from '../../engine/recommendAnimals';
import { EnclosureForm } from '../EnclosureForm/EnclosureForm';
import { AnimalGuides } from '../Blog/AnimalGuides';
import { SEO } from '../SEO/SEO';

interface FindYourAnimalViewProps {
  onAnimalSelected: (animalId: string) => void;
}

const defaultInput: EnclosureInput = {
  width: 18,
  depth: 18,
  height: 24,
  units: 'in',
  type: 'glass',
  animal: '',
  quantity: 1,
  bioactive: false,
  ambientTemp: 72,
  ambientHumidity: 50,
  humidityControl: 'manual',
  substratePreference: 'soil-based',
  plantPreference: 'live',
  backgroundType: 'none',
  careLevelPreference: 'any',
  numberOfHides: 3,
  numberOfLedges: 3,
  numberOfClimbingAreas: 2,
  hideStylePreference: 'both',
  doorOrientation: 'front',
  automatedLighting: false,
  setupTier: 'recommended',
  // New lifestyle preference defaults
  experienceLevel: 'any',
  lifespanPreference: 'any',
  handlingPreference: 'any',
  activityPreference: 'any',
  noiseTolerance: 'any',
  foodTypePreference: 'any',
  feedingFrequency: 'any',
  travelFrequency: 'any',
};

export function FindYourAnimalView({ onAnimalSelected }: FindYourAnimalViewProps) {
  const navigate = useNavigate();
  const [input, setInput] = useState<EnclosureInput>(defaultInput);
  const [recommendations, setRecommendations] = useState<ReturnType<
    typeof recommendAnimals
  > | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleFormChange = (newInput: EnclosureInput) => {
    setInput(newInput);
  };

  const handleSubmit = () => {
    const results = recommendAnimals(input);
    setRecommendations(results);
    setHasSubmitted(true);
    // Navigate to results page with state
    navigate('/find-animal/results', { state: { input, recommendations: results } });
  };

  const handleSelectAnimal = (animalId: string) => {
    onAnimalSelected(animalId);
    navigate('/design');
  };

  const {
    perfectMatches,
    goodFits,
    possible: possibleMatches,
  } = recommendations
    ? categorizeRecommendations(recommendations)
    : { perfectMatches: [], goodFits: [], possible: [] };

  const dynamicDescription = recommendations
    ? `Found ${perfectMatches.length + goodFits.length} compatible animals for your ${input.width}×${input.depth}×${input.height}" ${input.type} enclosure. Get personalized recommendations based on space, humidity, temperature, and care level preferences.`
    : 'Enter your enclosure dimensions and preferences to discover which reptiles and amphibians are perfectly suited for your setup. Our intelligent recommendation system evaluates compatibility based on space requirements, environmental needs, and care difficulty.';

  if (!hasSubmitted) {
    return (
      <div className="min-h-screen bg-card py-8 px-4">
        <SEO
          title="Find Your Perfect Animal - Enclosure Compatibility Tool"
          description={dynamicDescription}
        />
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/animal')}
              className="flex items-center gap-2 text-accent hover:text-accent mb-6 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Animals
            </button>
            <h1 className="text-4xl font-bold text-white mb-3">Find Your Perfect Animal</h1>
            <p className="text-lg text-muted">
              Tell us about your space and preferences, and we'll recommend animals that fit your
              setup.
            </p>
          </div>

          {/* Form */}
          <div className="bg-card rounded-xl p-6 border border-divider">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-2">Enclosure Specifications</h2>
              <p className="text-muted">Tell us about your setup and we'll find the best match</p>
            </div>
            <EnclosureForm value={input} onChange={handleFormChange} />
            <div className="mt-6">
              <button
                onClick={handleSubmit}
                className="w-full px-6 py-3 bg-accent hover:bg-accent-dim text-white font-bold rounded-xl transition-colors"
              >
                Get Recommendations
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="min-h-screen bg-card py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setHasSubmitted(false)}
            className="flex items-center gap-2 text-accent hover:text-accent mb-6 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Form
          </button>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <p className="text-blue-800 dark:text-blue-300">
              No recommendations found. Please try adjusting your parameters.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setHasSubmitted(false)}
            className="flex items-center gap-2 text-accent hover:text-accent mb-6 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Form
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Your Recommendations</h1>
          <p className="text-lg text-muted">
            Based on your setup preferences, here are the best animals for your space
          </p>
        </div>

        {/* Perfect Matches */}
        {perfectMatches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-6 h-6 text-accent" />
              <h2 className="text-2xl font-bold text-white">Perfect Matches</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {perfectMatches.map((rec) => (
                <AnimalRecommendationCard
                  key={rec.animalId}
                  recommendation={rec}
                  onSelect={handleSelectAnimal}
                />
              ))}
            </div>
          </div>
        )}

        {/* Good Fits */}
        {goodFits.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Good Fits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goodFits.map((rec) => (
                <AnimalRecommendationCard
                  key={rec.animalId}
                  recommendation={rec}
                  onSelect={handleSelectAnimal}
                />
              ))}
            </div>
          </div>
        )}

        {/* Possible with Modifications */}
        {possibleMatches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Possible (with modifications)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {possibleMatches.map((rec) => (
                <AnimalRecommendationCard
                  key={rec.animalId}
                  recommendation={rec}
                  onSelect={handleSelectAnimal}
                />
              ))}
            </div>
          </div>
        )}

        {/* Related Guides */}
        <div className="mt-12 pt-8 border-t border-divider">
          <h2 className="text-2xl font-bold text-white mb-6">Learn More</h2>
          <AnimalGuides />
        </div>
      </div>
    </div>
  );
}

interface AnimalRecommendationCardProps {
  recommendation: ReturnType<typeof recommendAnimals>[0];
  onSelect: (animalId: string) => void;
}

// Memoized recommendation card to prevent unnecessary re-renders
const AnimalRecommendationCard = memo(
  ({ recommendation, onSelect }: AnimalRecommendationCardProps) => {
    const { profile, compatibilityScore, reasons, warnings } = recommendation;

    const getScoreColor = (score: number) => {
      if (score >= 80) return 'bg-accent/15 border-accent/30';
      if (score >= 60)
        return 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700';
      return 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700';
    };

    const getScoreTextColor = (score: number) => {
      if (score >= 80) return 'text-accent';
      if (score >= 60) return 'text-amber-700 dark:text-amber-400';
      return 'text-orange-700 dark:text-orange-400';
    };

    return (
      <div
        className={`rounded-xl border-2 overflow-hidden flex flex-col ${getScoreColor(compatibilityScore)}`}
      >
        {/* Image */}
        {profile.imageUrl && (
          <div className="relative h-48 bg-card-elevated">
            <img
              src={profile.imageUrl}
              alt={profile.commonName}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
            {/* Score Badge Overlay */}
            <div className="absolute top-3 right-3 bg-card rounded-xl px-3 py-1">
              <div className={`text-xl font-bold ${getScoreTextColor(compatibilityScore)}`}>
                {compatibilityScore}%
              </div>
              <p className="text-xs text-muted text-center">Match</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Header */}
          <div className="mb-3">
            <h3 className="text-lg font-bold text-white">{profile.commonName}</h3>
            <p className="text-sm text-muted italic">{profile.scientificName}</p>
          </div>

          {/* Reasons */}
          {reasons.length > 0 && (
            <div className="mb-3">
              {reasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm mb-1">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-secondary">{reason}</span>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="mb-4 bg-surface/50 rounded-xl p-2">
              {warnings.map((warning, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs mb-1">
                  <AlertCircle className="w-3 h-3 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <span className="text-secondary">{warning}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={() => onSelect(recommendation.animalId)}
            className="w-full px-4 py-2 bg-accent hover:bg-accent-dim text-white font-medium rounded-xl transition-colors mt-auto"
          >
            Choose {profile.commonName}
          </button>
        </div>
      </div>
    );
  }
);

AnimalRecommendationCard.displayName = 'AnimalRecommendationCard';
