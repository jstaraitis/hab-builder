import { ArrowLeft, AlertCircle, Star, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { recommendAnimals, categorizeRecommendations } from '../../engine/recommendAnimals';
import { AnimalGuides } from '../Blog/AnimalGuides';
import { SEO } from '../SEO/SEO';
import { useUnits } from '../../contexts/UnitsContext';
import { formatDimensions, formatTemp } from '../../utils/unitConversion';

interface AnimalRecommendationCardProps {
  recommendation: ReturnType<typeof recommendAnimals>[0];
  onSelect: (animalId: string) => void;
  onToggleComparison?: (animalId: string) => void;
  isSelectedForComparison?: boolean;
  comparisonMode?: boolean;
}

function AnimalRecommendationCard({ recommendation, onSelect, onToggleComparison, isSelectedForComparison, comparisonMode }: AnimalRecommendationCardProps) {
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
    <div className={`rounded-lg border-2 overflow-hidden flex flex-col ${getScoreColor(compatibilityScore)} ${isSelectedForComparison ? 'ring-4 ring-emerald-500 dark:ring-emerald-400' : ''}`}>
      {/* Image */}
      {profile.imageUrl && (
        <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
          <img
            src={profile.imageUrl}
            alt={profile.commonName}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
          {/* Comparison Checkbox */}
          {comparisonMode && onToggleComparison && (
            <div className="absolute top-3 left-3">
              <input
                type="checkbox"
                checked={isSelectedForComparison}
                onChange={() => onToggleComparison(recommendation.animalId)}
                className="w-5 h-5 rounded border-2 border-white cursor-pointer accent-emerald-600"
              />
            </div>
          )}
          {/* Score Badge Overlay */}
          <div className="absolute top-3 right-3 bg-white dark:bg-gray-800 rounded-lg px-3 py-1 shadow-lg">
            <div className={`text-xl font-bold ${getScoreTextColor(compatibilityScore)}`}>
              {compatibilityScore}%
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">Match</p>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{profile.commonName}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 italic">{profile.scientificName}</p>
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
        className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors mt-auto"
      >
        Choose {profile.commonName}
      </button>
      </div>
    </div>
  );
}

interface FindYourAnimalResultsViewProps {
  onAnimalSelected: (animalId: string) => void;
}

export function FindYourAnimalResultsView({ onAnimalSelected }: FindYourAnimalResultsViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { input, recommendations } = location.state || {};
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const { isMetric } = useUnits();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // If no data, redirect back to form
  useEffect(() => {
    if (!input || !recommendations) {
      navigate('/find-animal');
    }
  }, [input, recommendations, navigate]);

  if (!input || !recommendations) {
    return null;
  }

  const handleSelectAnimal = (animalId: string) => {
    onAnimalSelected(animalId);
    navigate('/design');
  };

  const handleToggleComparison = (animalId: string) => {
    setSelectedForComparison(prev => 
      prev.includes(animalId) 
        ? prev.filter(id => id !== animalId)
        : [...prev, animalId]
    );
  };

  const handleShowComparison = () => {
    setShowComparison(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { perfectMatches, goodFits, possible: possibleMatches } = categorizeRecommendations(recommendations);

  const dynamicDescription = `Found ${perfectMatches.length + goodFits.length} compatible animals for your ${input.width}×${input.depth}×${input.height}" ${input.type} enclosure.`;

  // No results case
  if (perfectMatches.length === 0 && goodFits.length === 0 && possibleMatches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
        <SEO title="No Recommendations Found" description="Try adjusting your enclosure parameters" />
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/find-animal')}
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
      <SEO
        title="Your Animal Recommendations"
        description={dynamicDescription}
        keywords={['animal recommendations', 'reptile compatibility', 'enclosure match']}
      />
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/find-animal')}
            className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mb-6 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Form
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Your Recommendations
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Based on your {input.width}×{input.depth}×{input.height}" {input.type} enclosure
              </p>
            </div>
            <button
              onClick={() => {
                if (showComparison) {
                  setShowComparison(false);
                  setSelectedForComparison([]);
                } else {
                  setShowComparison(true);
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showComparison
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {showComparison ? 'Cancel Comparison' : 'Compare Species'}
            </button>
          </div>
        </div>

        {/* Comparison Bar */}
        {showComparison && selectedForComparison.length > 0 && (
          <div className="sticky top-4 z-10 mb-6 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold">{selectedForComparison.length} species selected</p>
                <p className="text-sm text-emerald-100">Select 2-4 animals to compare</p>
              </div>
              <button
                onClick={handleShowComparison}
                disabled={selectedForComparison.length < 2}
                className="px-6 py-2 bg-white text-emerald-700 font-bold rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                View Comparison
              </button>
            </div>
          </div>
        )}

        {/* Comparison Table View */}
        {showComparison && selectedForComparison.length >= 2 && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Species Comparison</h2>
              <button
                onClick={() => setSelectedForComparison([])}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Clear Selection
              </button>
            </div>
            
            {/* Mobile View - Stacked Cards */}
            <div className="md:hidden space-y-4">
              {selectedForComparison.map(animalId => {
                const rec = recommendations.find((r: any) => r.animalId === animalId);
                if (!rec) return null;
                const temp = rec.profile.careTargets?.temperature;
                const humidity = rec.profile.careTargets?.humidity;
                const lighting = rec.profile.careTargets?.lighting;
                const size = rec.profile.minEnclosureSize;
                
                return (
                  <div key={animalId} className="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    {/* Header with Image */}
                    <div className="relative h-40 bg-gray-200 dark:bg-gray-700">
                      {rec.profile.imageUrl && (
                        <img
                          src={rec.profile.imageUrl}
                          alt={rec.profile.commonName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                      <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-lg px-2 py-1">
                        <span className={`text-lg font-bold ${
                          rec.compatibilityScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                          rec.compatibilityScore >= 60 ? 'text-amber-600 dark:text-amber-400' :
                          'text-orange-600 dark:text-orange-400'
                        }`}>
                          {rec.compatibilityScore}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <div className="font-bold text-lg text-gray-900 dark:text-white">{rec.profile.commonName}</div>
                        <div className="text-sm italic text-gray-600 dark:text-gray-400">{rec.profile.scientificName}</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Care Level</div>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            rec.profile.careLevel === 'beginner' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                            rec.profile.careLevel === 'intermediate' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {rec.profile.careLevel}
                          </span>
                        </div>
                        
                        <div>
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Min Size</div>
                          <div className="text-gray-900 dark:text-gray-100 mt-1">{formatDimensions(size?.width || 0, size?.depth || 0, size?.height || 0, isMetric)}</div>
                        </div>
                        
                        <div>
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Temperature</div>
                          <div className="text-gray-900 dark:text-gray-100 mt-1">
                            {temp?.thermalGradient ? (
                              <div className="text-xs">
                                <div>{formatTemp(temp.coolSide?.min || 0, isMetric)}-{formatTemp(temp.coolSide?.max || 0, isMetric)} (cool)</div>
                                <div>{formatTemp(temp.warmSide?.min || 0, isMetric)}-{formatTemp(temp.warmSide?.max || 0, isMetric)} (warm)</div>
                              </div>
                            ) : (
                              <div>{formatTemp(temp?.min || 0, isMetric)}-{formatTemp(temp?.max || 0, isMetric)}</div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Humidity</div>
                          <div className="text-gray-900 dark:text-gray-100 mt-1">{humidity?.day?.min}-{humidity?.day?.max}%</div>
                        </div>
                        
                        <div>
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">UVB</div>
                          <div className="text-gray-900 dark:text-gray-100 mt-1">
                            {lighting?.uvbRequired ? (lighting.uvbStrength || 'Required') : 'Not required'}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Bioactive</div>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            rec.profile.bioactiveCompatible ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {rec.profile.bioactiveCompatible ? 'Compatible' : 'Not ideal'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Desktop View - Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                    <th className="text-left p-3 font-bold text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800">Attribute</th>
                    {selectedForComparison.map(animalId => {
                      const rec = recommendations.find((r: any) => r.animalId === animalId);
                      return (
                        <th key={animalId} className="text-center p-3 min-w-[200px]">
                          <div className="space-y-2">
                            {rec?.profile.imageUrl && (
                              <img
                                src={rec.profile.imageUrl}
                                alt={rec.profile.commonName}
                                className="w-full h-32 object-cover rounded-lg"
                                loading="lazy"
                                decoding="async"
                              />
                            )}
                            <div className="font-bold text-gray-900 dark:text-white">{rec?.profile.commonName}</div>
                            <div className="text-xs italic text-gray-600 dark:text-gray-400">{rec?.profile.scientificName}</div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {/* Compatibility Score */}
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="p-3 font-semibold text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800">Match Score</td>
                    {selectedForComparison.map(animalId => {
                      const rec = recommendations.find((r: any) => r.animalId === animalId);
                      return (
                        <td key={animalId} className="p-3 text-center">
                          <span className={`text-2xl font-bold ${
                            rec!.compatibilityScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                            rec!.compatibilityScore >= 60 ? 'text-amber-600 dark:text-amber-400' :
                            'text-orange-600 dark:text-orange-400'
                          }`}>
                            {rec?.compatibilityScore}%
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Care Level */}
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <td className="p-3 font-semibold text-gray-700 dark:text-gray-300 sticky left-0 bg-gray-50 dark:bg-gray-900/50">Care Level</td>
                    {selectedForComparison.map(animalId => {
                      const rec = recommendations.find((r: any) => r.animalId === animalId);
                      return (
                        <td key={animalId} className="p-3 text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            rec?.profile.careLevel === 'beginner' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                            rec?.profile.careLevel === 'intermediate' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {rec?.profile.careLevel}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Min Enclosure Size */}
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="p-3 font-semibold text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800">Min Size</td>
                    {selectedForComparison.map(animalId => {
                      const rec = recommendations.find((r: any) => r.animalId === animalId);
                      const size = rec?.profile.minEnclosureSize;
                      return (
                        <td key={animalId} className="p-3 text-center text-gray-900 dark:text-gray-100">
                          {size && formatDimensions(size.width, size.depth, size.height, isMetric)}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Temperature */}
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <td className="p-3 font-semibold text-gray-700 dark:text-gray-300 sticky left-0 bg-gray-50 dark:bg-gray-900/50">Temperature</td>
                    {selectedForComparison.map(animalId => {
                      const rec = recommendations.find((r: any) => r.animalId === animalId);
                      const temp = rec?.profile.careTargets?.temperature;
                      return (
                        <td key={animalId} className="p-3 text-center text-sm text-gray-900 dark:text-gray-100">
                          {temp?.thermalGradient ? (
                            <div>
                              <div>Cool: {formatTemp(temp.coolSide?.min || 0, isMetric)}-{formatTemp(temp.coolSide?.max || 0, isMetric)}</div>
                              <div>Warm: {formatTemp(temp.warmSide?.min || 0, isMetric)}-{formatTemp(temp.warmSide?.max || 0, isMetric)}</div>
                            </div>
                          ) : (
                            <div>{formatTemp(temp?.min || 0, isMetric)}-{formatTemp(temp?.max || 0, isMetric)}</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Humidity */}
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="p-3 font-semibold text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800">Humidity</td>
                    {selectedForComparison.map(animalId => {
                      const rec = recommendations.find((r: any) => r.animalId === animalId);
                      const humidity = rec?.profile.careTargets?.humidity;
                      return (
                        <td key={animalId} className="p-3 text-center text-sm text-gray-900 dark:text-gray-100">
                          {humidity?.day?.min}-{humidity?.day?.max}%
                        </td>
                      );
                    })}
                  </tr>

                  {/* UVB Required */}
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <td className="p-3 font-semibold text-gray-700 dark:text-gray-300 sticky left-0 bg-gray-50 dark:bg-gray-900/50">UVB</td>
                    {selectedForComparison.map(animalId => {
                      const rec = recommendations.find((r: any) => r.animalId === animalId);
                      const uvb = rec?.profile.careTargets?.lighting?.uvbRequired;
                      const strength = rec?.profile.careTargets?.lighting?.uvbStrength;
                      return (
                        <td key={animalId} className="p-3 text-center text-gray-900 dark:text-gray-100">
                          {uvb ? (strength || 'Required') : 'Not required'}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Bioactive Compatible */}
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="p-3 font-semibold text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800">Bioactive</td>
                    {selectedForComparison.map(animalId => {
                      const rec = recommendations.find((r: any) => r.animalId === animalId);
                      const bioactive = rec?.profile.bioactiveCompatible;
                      return (
                        <td key={animalId} className="p-3 text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            bioactive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {bioactive ? 'Compatible' : 'Not ideal'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

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
                  comparisonMode={showComparison}
                  onToggleComparison={handleToggleComparison}
                  isSelectedForComparison={selectedForComparison.includes(rec.animalId)}
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
                  comparisonMode={showComparison}
                  onToggleComparison={handleToggleComparison}
                  isSelectedForComparison={selectedForComparison.includes(rec.animalId)}
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
                  comparisonMode={showComparison}
                  onToggleComparison={handleToggleComparison}
                  isSelectedForComparison={selectedForComparison.includes(rec.animalId)}
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
