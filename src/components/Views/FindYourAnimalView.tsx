import { ArrowLeft, AlertCircle, CheckCircle, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
};

export function FindYourAnimalView({ onAnimalSelected }: FindYourAnimalViewProps) {
  const navigate = useNavigate();
  const [input, setInput] = useState<EnclosureInput>(defaultInput);
  const [recommendations, setRecommendations] = useState<ReturnType<typeof recommendAnimals> | null>(null);
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

  const { perfectMatches, goodFits, possible: possibleMatches } = recommendations
    ? categorizeRecommendations(recommendations)
    : { perfectMatches: [], goodFits: [], possible: [] };

  const dynamicDescription = recommendations
    ? `Found ${perfectMatches.length + goodFits.length} compatible animals for your ${input.width}×${input.depth}×${input.height}" ${input.type} enclosure. Get personalized recommendations based on space, humidity, temperature, and care level preferences.`
    : 'Enter your enclosure dimensions and preferences to discover which reptiles and amphibians are perfectly suited for your setup. Our intelligent recommendation system evaluates compatibility based on space requirements, environmental needs, and care difficulty.';

  if (!hasSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
        <SEO
          title="Find Your Perfect Animal - Enclosure Compatibility Tool"
          description={dynamicDescription}
          keywords={[
            'find reptile for enclosure',
            'animal recommendation tool',
            'reptile compatibility checker',
            'enclosure animal matcher',
            'which reptile for my tank',
            'terrarium animal finder',
            'vivarium compatibility tool',
            'reptile space calculator',
            'amphibian enclosure match'
          ]}
        />
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/animal')}
              className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mb-6 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Animals
            </button>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Find Your Perfect Animal
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Tell us about your space and preferences, and we'll recommend animals that fit your setup.
            </p>
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Enclosure Specifications</h2>
              <p className="text-gray-600 dark:text-gray-400">Tell us about your setup and we'll find the best match</p>
            </div>
            <EnclosureForm value={input} onChange={handleFormChange} />
            <div className="mt-6">
              <button
                onClick={handleSubmit}
                className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors"
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
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setHasSubmitted(false)}
            className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mb-6 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Form
          </button>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <p className="text-blue-800 dark:text-blue-300">No recommendations found. Please try adjusting your parameters.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setHasSubmitted(false)}
            className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mb-6 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Form
          </button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Your Recommendations
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Based on your setup preferences, here are the best animals for your space
          </p>
        </div>

        {/* Perfect Matches */}
        {perfectMatches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Perfect Matches</h2>
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Good Fits</h2>
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Possible (with modifications)</h2>
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
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Learn More</h2>
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

function AnimalRecommendationCard({ recommendation, onSelect }: AnimalRecommendationCardProps) {
  const { profile, compatibilityScore, reasons, warnings } = recommendation;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700';
    if (score >= 60) return 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700';
    return 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700';
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-700 dark:text-amber-400';
    return 'text-orange-700 dark:text-orange-400';
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${getScoreColor(compatibilityScore)}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{profile.commonName}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 italic">{profile.scientificName}</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getScoreTextColor(compatibilityScore)}`}>
            {compatibilityScore}%
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Match</p>
        </div>
      </div>

      {/* Reasons */}
      {reasons.length > 0 && (
        <div className="mb-3">
          {reasons.map((reason, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">{reason}</span>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mb-4 bg-white dark:bg-gray-900/50 rounded p-2">
          {warnings.map((warning, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs mb-1">
              <AlertCircle className="w-3 h-3 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={() => onSelect(recommendation.animalId)}
        className="w-full mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
      >
        Choose {profile.commonName}
      </button>
    </div>
  );
}
