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
      if (animal.scientificName) {
        searchParts.push(animal.scientificName);
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
        <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-white bg-emerald-600 dark:bg-emerald-500 rounded-md">
          <CheckCircle className="w-3 h-3" />
          Complete
        </span>
      );
    }
    if (status === 'validated') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-white bg-blue-600 dark:bg-blue-500 rounded-md">
          <Star className="w-3 h-3" />
          Validated
        </span>
      );
    }
    if (status === 'in-progress') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-gray-900 dark:text-gray-900 bg-yellow-400 dark:bg-yellow-400 rounded-md">
          <Clock className="w-3 h-3" />
          In Progress
        </span>
      );
    }
    if (status === 'draft') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-gray-900 dark:text-gray-900 bg-gray-400 dark:bg-gray-400 rounded-md">
          <FileText className="w-3 h-3" />
          Coming Soon
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

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
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
              className={`group p-3 sm:p-4 lg:p-5 rounded-xl border-2 transition-all duration-200 relative ${
                selected === animal.id
                  ? `${getSelectedColors()} shadow-lg scale-105 -translate-y-1 ring-2 ring-offset-2 ${animal.careLevel === 'beginner' ? 'ring-green-400' : animal.careLevel === 'intermediate' ? 'ring-orange-400' : 'ring-red-400'}`
                  : 'border-gray-100 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:-translate-y-1 active:scale-95'
              } ${isDraft ? 'cursor-not-allowed opacity-40' : ''}`}
            >
            {/* Image or Emoji */}
            <div className="relative w-full h-28 sm:h-36 lg:h-44 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl mb-3 flex items-center justify-center overflow-hidden shadow-inner">
              {animal.imageUrl ? (
                <>
                  <img 
                    src={animal.imageUrl} 
                    alt={animal.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  {/* Dark gradient overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />
                </>
              ) : (
                <div className="text-4xl sm:text-5xl lg:text-6xl group-hover:scale-110 transition-transform duration-200">{animal.image}</div>
              )}
              
              {/* Status Badge */}
              {animal.completionStatus && (
                <div className="absolute bottom-2 right-2">
                  {getStatusBadge(animal.completionStatus)}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm lg:text-base leading-tight">
                {animal.name}
              </h3>
              <span className={`inline-block px-2 py-1 text-[10px] sm:text-xs font-bold rounded-lg ${
                animal.careLevel === 'beginner' 
                  ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50' 
                  : animal.careLevel === 'intermediate'
                  ? 'text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/50'
                  : 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50'
              }`}>
                {animal.careLevel.charAt(0).toUpperCase() + animal.careLevel.slice(1)}
              </span>
            </div>
          </button>
          );
        })}
      </div>
    </div>
  );
}
