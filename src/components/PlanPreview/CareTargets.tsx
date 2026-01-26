import type { CareTargets as CareTargetsType, Warning } from '../../engine/types';

interface CareTargetsProps {
  targets: CareTargetsType;
  showHeader?: boolean;
  infoWarnings?: Warning[];
  mistingNotes?: string[];
}

export function CareTargets({ targets, showHeader = true, infoWarnings = [], mistingNotes = [] }: CareTargetsProps) {
  void infoWarnings; // Available for future expansion
  
  const cards = (
    <>
      {/* Temperature Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800 p-5 hover:shadow-lg transition-shadow h-full flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div className="bg-red-100 dark:bg-red-900/40 rounded-full p-3">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4" />
              </svg>
            </div>
          </div>
          <h4 className="font-bold text-gray-900 dark:text-white text-lg md:text-xl mb-3">Temperature</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm md:text-base text-gray-600 dark:text-gray-300 flex items-center gap-1">
                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                </svg>
                Daytime
              </span>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                {targets.temperature.min}–{targets.temperature.max}°{targets.temperature.unit}
              </span>
            </div>
            {targets.temperature.nighttime && (
              <div className="flex items-center justify-between">
                <span className="text-sm md:text-base text-gray-600 dark:text-gray-300 flex items-center gap-1">
                  <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                  Nighttime
                </span>
                <span className="text-xl font-bold text-red-500 dark:text-red-300">
                  {targets.temperature.nighttime.min}–{targets.temperature.nighttime.max}°{targets.temperature.unit}
                </span>
              </div>
            )}
            {targets.temperature.basking && (
              <div className="flex items-center justify-between pt-2 border-t border-red-200 dark:border-red-800">
                <span className="text-sm md:text-base text-gray-600 dark:text-gray-300">Basking</span>
                <span className="text-lg font-semibold text-red-700 dark:text-red-300">
                  {targets.temperature.basking}°{targets.temperature.unit}
                </span>
              </div>
            )}
            <p className="text-xs text-gray-600 dark:text-gray-400 pt-2">{targets.gradient}</p>
          </div>
        </div>

        {/* Humidity Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800 p-5 hover:shadow-lg transition-shadow h-full flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div className="bg-blue-100 dark:bg-blue-900/40 rounded-full p-3">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
          </div>
          <h4 className="font-bold text-gray-900 dark:text-white text-lg md:text-xl mb-3">Humidity</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm md:text-base text-gray-600 dark:text-gray-300">Range</span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {targets.humidity.min}–{targets.humidity.max}{targets.humidity.unit}
              </span>
            </div>
            {mistingNotes.length > 0 && (
              <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                <h5 className="text-sm md:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Daily Misting</h5>
                <div className="space-y-1.5">
                  {mistingNotes.map((note, idx) => (
                    <p key={`misting-${idx}`} className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed flex items-start gap-1.5">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>{note}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-gray-600 dark:text-gray-400 pt-2">
              Misters/foggers not recommended. High humidity increases risk of bacterial and respiratory infections.
            </p>
          </div>
        </div>

        {/* Lighting Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-2 border-amber-200 dark:border-amber-800 p-5 hover:shadow-lg transition-shadow h-full flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div className="bg-amber-100 dark:bg-amber-900/40 rounded-full p-3">
              <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M2 12h2m16 0h2M6.34 17.66l-1.42 1.42M19.08 4.93l-1.42 1.42M12 7a5 5 0 100 10 5 5 0 000-10z" />
              </svg>
            </div>
          </div>
          <h4 className="font-bold text-gray-900 dark:text-white text-lg md:text-xl mb-3">Lighting</h4>
          <div className="space-y-2">
            {targets.lighting.uvbRequired ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm md:text-base text-gray-600 dark:text-gray-300">UVB</span>
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {targets.lighting.uvbStrength}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-amber-200 dark:border-amber-800">
                  <span className="text-sm md:text-base text-gray-600 dark:text-gray-300">Coverage</span>
                  <span className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                    {targets.lighting.coveragePercent}%
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">UVB not required, but beneficial</p>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-amber-200 dark:border-amber-800">
              <span className="text-sm md:text-base text-gray-600 dark:text-gray-300">Photo Period</span>
              <span className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                {targets.lighting.photoperiod}
              </span>
            </div>
          </div>
        </div>
      </>
  );
  
  // When used without header, return just the cards to be placed in parent grid
  if (!showHeader) {
    return cards;
  }
  
  // When used with header, wrap in container with its own grid
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Care Parameters</h3>
      <div className="grid md:grid-cols-3 gap-4">
        {cards}
      </div>
    </div>
  );
}
