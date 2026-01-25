import { useState } from 'react';
import { animalList } from '../../data/animals';
import { FileText, CheckCircle, Sliders, Zap, Star, Clock } from 'lucide-react';

interface AnimalPickerProps {
  selected: string;
  onSelect: (animalId: string) => void;
}

export function AnimalPicker({ selected, onSelect }: AnimalPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [careLevelFilter, setCareLevelFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  // Filter animals based on search query and care level
  // Search will match `name`, `id`, and optional `searchQuery` or `commonNames` fields in animal profiles
  const filteredAnimals = animalList
    .filter(animal => {
      const q = searchQuery.trim().toLowerCase();

      const searchParts: string[] = [];
      if (animal.name) searchParts.push(animal.name);
      if (animal.id) searchParts.push(animal.id);
      if (animal.searchQuery) {
        searchParts.push(Array.isArray(animal.searchQuery) ? animal.searchQuery.join(' ') : String(animal.searchQuery));
      }
      if (animal.commonNames) {
        searchParts.push(Array.isArray(animal.commonNames) ? animal.commonNames.join(' ') : String(animal.commonNames));
      }

      const searchable = searchParts.join(' ').toLowerCase();
      const matchesSearch = q === '' || searchable.includes(q);
      const matchesCareLevel = careLevelFilter === 'all' || animal.careLevel === careLevelFilter;
      return matchesSearch && matchesCareLevel;
    })
    // Sort by status priority (validated → in-progress → draft), then by name
    .sort((a, b) => {
      const statusOrder: Record<string, number> = {
        'validated': 0,
        'in-progress': 1,
        'draft': 2,
        'complete': 3,
      };

      const pa = statusOrder[a.completionStatus ?? ''] ?? 99;
      const pb = statusOrder[b.completionStatus ?? ''] ?? 99;

      if (pa !== pb) return pa - pb;
      return a.name.localeCompare(b.name);
    });

  const getStatusBadge = (status?: string) => {
    if (status === 'complete') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 backdrop-blur-sm rounded-lg shadow-lg border-2 border-green-400/30 dark:border-green-500/30">
          <CheckCircle className="w-4 h-4" />
          Complete
        </span>
      );
    }
    if (status === 'validated') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 backdrop-blur-sm rounded-lg shadow-lg border-2 border-blue-400/30 dark:border-blue-500/30">
          <Star className="w-4 h-4" />
          Validated
        </span>
      );
    }
    if (status === 'in-progress') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-br from-yellow-500 to-orange-600 dark:from-yellow-600 dark:to-orange-700 backdrop-blur-sm rounded-lg shadow-lg border-2 border-yellow-400/30 dark:border-yellow-500/30">
          <Clock className="w-4 h-4" />
          In Progress
        </span>
      );
    }
    if (status === 'draft') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-yellow-600 dark:bg-yellow-500 backdrop-blur-sm rounded-full shadow-md">
          <FileText className="w-4 h-4" />
          Draft
        </span>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Select Animal</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Choose your animal and we'll build a habitat for it.</p>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search animals (e.g., snake, gecko, turtle)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-11 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
          <svg 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {/* Care Level Filter Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setCareLevelFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              careLevelFilter === 'all'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setCareLevelFilter('beginner')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              careLevelFilter === 'beginner'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <CheckCircle className="inline-block w-4 h-4 mr-2" /> Beginner
          </button>
          <button
            onClick={() => setCareLevelFilter('intermediate')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              careLevelFilter === 'intermediate'
                ? 'bg-yellow-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Sliders className="inline-block w-4 h-4 mr-2" /> Intermediate
          </button>
          <button
            onClick={() => setCareLevelFilter('advanced')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              careLevelFilter === 'advanced'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Zap className="inline-block w-4 h-4 mr-2" /> Advanced
          </button>
        </div>

        {/* Care level explanation - only visible when a specific level is selected */}
        {careLevelFilter !== 'all' && (
          <div className="mt-3 p-3 rounded-md bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
            {careLevelFilter === 'beginner' && (
              <>Beginner — Easygoing species and straightforward setups. Great for first-timers.</>
            )}
            {careLevelFilter === 'intermediate' && (
              <>Intermediate — Some special equipment or husbandry required; moderate experience helpful.</>
            )}
            {careLevelFilter === 'advanced' && (
              <>Advanced — Demanding species needing precise environment control and experienced care.</>
            )}
          </div>
        )}
        
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Found {filteredAnimals.length} {filteredAnimals.length === 1 ? 'animal' : 'animals'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredAnimals.map((animal) => {
          // Determine border and background colors based on care level
          const getSelectedColors = () => {
            if (animal.careLevel === 'beginner') {
              return 'border-green-600 bg-green-50 dark:bg-green-900/30';
            } else if (animal.careLevel === 'intermediate') {
              return 'border-orange-600 bg-orange-50 dark:bg-orange-900/30';
            } else {
              return 'border-red-600 bg-red-50 dark:bg-red-900/30';
            }
          };

          const isDraft = animal.completionStatus === 'draft';

          return (
            <button
              key={animal.id}
              onClick={() => !isDraft && onSelect(animal.id)}
              disabled={isDraft}
              aria-disabled={isDraft}
              title={isDraft ? `${animal.name} (Draft - not selectable)` : `Select ${animal.name}`}
              tabIndex={isDraft ? -1 : 0}
              className={`p-6 rounded-lg border-2 transition-all relative ${
                selected === animal.id
                  ? `${getSelectedColors()} shadow-lg`
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md bg-white dark:bg-gray-700'
              } ${isDraft ? 'cursor-not-allowed' : ''}`}
            >
            {/* Status Badge - Top Right Corner */}
            <div className="absolute top-3 right-3 z-30">
              {getStatusBadge(animal.completionStatus)}
            </div>
            
            {/* Image or Emoji */}
            <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-600 rounded-lg mb-3 flex items-center justify-center overflow-hidden group">
              {animal.imageUrl ? (
                <>
                  <img 
                    src={animal.imageUrl} 
                    alt={animal.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-150"
                  />
                  {/* Dark gradient overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                </>
              ) : (
                <div className="text-6xl">{animal.image}</div>
              )}
            </div>
            {/* Draft overlay - visible but non-interactive */}
            {isDraft && (
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                <div className="px-4 py-2 bg-black/65 text-white rounded-full text-sm font-semibold backdrop-blur-sm">Coming soon</div>
              </div>
            )}

            <h3 className="font-semibold text-gray-800 dark:text-white text-lg mb-1">
              {animal.name}
            </h3>
            <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
              animal.careLevel === 'beginner' 
                ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50' 
                : animal.careLevel === 'intermediate'
                ? 'text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/50'
                : 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50'
            }`}>
              {animal.careLevel.charAt(0).toUpperCase() + animal.careLevel.slice(1)}
            </span>
          </button>
          );
        })}
      </div>
    </div>
  );
}
