import { useState } from 'react';
import { animalList } from '../../data/animals';
import { FileText, CheckCircle, Sliders, Zap, Star, Clock } from 'lucide-react';

interface AnimalPickerProps {
  selected: string;
  onSelect: (animalId: string) => void;
}

type Category = 'all' | 'frogs' | 'geckos' | 'snakes' | 'lizards' | 'turtles';

// Category mapping based on animal ID patterns
const getAnimalCategory = (animalId: string): Category => {
  if (animalId.includes('frog')) return 'frogs';
  if (animalId.includes('gecko')) return 'geckos';
  if (animalId.includes('snake') || animalId.includes('python')) return 'snakes';
  if (animalId.includes('slider') || animalId.includes('turtle')) return 'turtles';
  if (animalId.includes('dragon') || animalId.includes('skink')) return 'lizards';
  return 'all';
};

export function AnimalPicker({ selected, onSelect }: AnimalPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [careLevelFilter, setCareLevelFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category>('all');

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
      const matchesCategory = categoryFilter === 'all' || getAnimalCategory(animal.id) === categoryFilter;
      return matchesSearch && matchesCareLevel && matchesCategory;
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
    if (status === 'complete' || status === 'validated') {
      return (
        <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-emerald-600/95 dark:bg-emerald-500/95 flex items-center justify-center shadow-xl backdrop-blur-sm border-2 border-white dark:border-gray-900">
          <Star className="w-5 h-5 text-white fill-white" />
        </div>
      );
    }
    if (status === 'in-progress') {
      return (
        <div className="absolute top-0 right-0 overflow-hidden w-24 h-24 pointer-events-none">
          <div className="absolute top-4 -right-8 bg-yellow-400 dark:bg-yellow-400 text-gray-900 text-[10px] md:text-xs font-bold py-1 px-10 rotate-45 shadow-lg flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span>NEW</span>
          </div>
        </div>
      );
    }
    if (status === 'draft') {
      return (
        <div className="absolute top-0 right-0 overflow-hidden w-24 h-24 pointer-events-none">
          <div className="absolute top-4 -right-8 bg-gray-500 dark:bg-gray-500 text-white text-[10px] md:text-xs font-bold py-1 px-10 rotate-45 shadow-lg flex items-center justify-center gap-1">
            <FileText className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span>SOON</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Select Animal</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Choose your animal and we'll build a habitat for it.</p>
      
      {/* Category Selection - Dropdown on Mobile, Tabs on Desktop */}
      <div className="mb-4">
        {/* Mobile Dropdown */}
        <div className="md:hidden">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as Category)}
            className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Animals</option>
            <option value="frogs">🐸 Frogs & Toads</option>
            <option value="geckos">🦎 Geckos</option>
            <option value="snakes">🐍 Snakes</option>
            <option value="lizards">🦎 Lizards</option>
            <option value="turtles">🐢 Turtles & Tortoises</option>
          </select>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden md:flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              categoryFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All Animals
          </button>
          <button
            onClick={() => setCategoryFilter('frogs')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              categoryFilter === 'frogs'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            🐸 Frogs & Toads
          </button>
          <button
            onClick={() => setCategoryFilter('geckos')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              categoryFilter === 'geckos'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            🦎 Geckos
          </button>
          <button
            onClick={() => setCategoryFilter('snakes')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              categoryFilter === 'snakes'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            🐍 Snakes
          </button>
          <button
            onClick={() => setCategoryFilter('lizards')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              categoryFilter === 'lizards'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            🦎 Lizards
          </button>
          <button
            onClick={() => setCategoryFilter('turtles')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              categoryFilter === 'turtles'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            🐢 Turtles & Tortoises
          </button>
        </div>
      </div>
      
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
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <CheckCircle className="inline-block w-4 h-4 mr-2" /> Beginner
          </button>
          <button
            onClick={() => setCareLevelFilter('intermediate')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              careLevelFilter === 'intermediate'
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Sliders className="inline-block w-4 h-4 mr-2" /> Intermediate
          </button>
          <button
            onClick={() => setCareLevelFilter('advanced')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              careLevelFilter === 'advanced'
                ? 'bg-red-500 text-white shadow-md'
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

      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 justify-items-stretch">
        {filteredAnimals.map((animal) => {
          // Determine border and accent colors based on care level
          const getCareLevelColors = () => {
            if (animal.careLevel === 'beginner') {
              return {
                border: 'border-green-500',
                bg: 'bg-green-50 dark:bg-green-900/20',
                accent: 'bg-green-500',
                text: 'text-green-700 dark:text-green-300'
              };
            } else if (animal.careLevel === 'intermediate') {
              return {
                border: 'border-orange-500',
                bg: 'bg-orange-50 dark:bg-orange-900/20',
                accent: 'bg-orange-500',
                text: 'text-orange-700 dark:text-orange-300'
              };
            } else {
              return {
                border: 'border-red-500',
                bg: 'bg-red-50 dark:bg-red-900/20',
                accent: 'bg-red-500',
                text: 'text-red-700 dark:text-red-300'
              };
            }
          };

          const colors = getCareLevelColors();
          const isDraft = animal.completionStatus === 'draft';
          const isVerified = animal.completionStatus === 'complete' || animal.completionStatus === 'validated';

          return (
            <button
              key={animal.id}
              onClick={() => !isDraft && onSelect(animal.id)}
              disabled={isDraft}
              aria-disabled={isDraft}
              title={isDraft ? `${animal.name} (Draft - not selectable)` : `Select ${animal.name}`}
              tabIndex={isDraft ? -1 : 0}
              className={`group relative overflow-hidden rounded-xl transition-all duration-300 text-left ${
                selected === animal.id
                  ? `${colors.bg} ring-4 ${colors.border} shadow-xl scale-[1.02]`
                  : isVerified
                  ? 'bg-white dark:bg-gray-800 hover:shadow-2xl hover:scale-[1.02] shadow-lg ring-1 ring-emerald-500/20 dark:ring-emerald-400/20'
                  : 'bg-white dark:bg-gray-800 hover:shadow-lg hover:scale-[1.01]'
              } ${isDraft ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
            >
              {/* Colored accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${colors.accent}`} />

              {/* Image with colored border and text overlay */}
              <div className="p-2 sm:p-3">
                <div className={`relative w-full aspect-[4/3] rounded-lg overflow-hidden border-2 md:border-4 ${
                  selected === animal.id ? colors.border : 'border-gray-200 dark:border-gray-700'
                } transition-all duration-300`}>
                  {animal.imageUrl ? (
                    <img 
                      src={animal.imageUrl} 
                      alt={animal.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                      <div className="text-5xl group-hover:scale-110 transition-transform duration-300">{animal.image}</div>
                    </div>
                  )}
                  
                  {/* Dark gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                  
                  {/* Status Ribbon - Top Right Corner */}
                  {animal.completionStatus && getStatusBadge(animal.completionStatus)}

                  {/* Text overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 md:p-3 space-y-0.5">
                    {/* Common Name - Bold and Prominent */}
                    <h3 className="font-bold text-sm md:text-base text-white leading-tight tracking-tight line-clamp-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                      {animal.name}
                    </h3>
                    
                    {/* Scientific Name - Prominent italic */}
                    {animal.scientificName && (
                      <p className="text-[11px] md:text-xs font-medium italic text-white/95 tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                        {animal.scientificName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
