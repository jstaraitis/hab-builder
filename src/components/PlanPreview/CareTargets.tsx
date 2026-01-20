import type { CareTargets as CareTargetsType, Warning } from '../../engine/types';

interface CareTargetsProps {
  targets: CareTargetsType;
  showHeader?: boolean;
  infoWarnings?: Warning[];
}

export function CareTargets({ targets, showHeader = true, infoWarnings = [] }: CareTargetsProps) {
  void infoWarnings; // Available for future expansion
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {showHeader && (
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Care Parameters</h3>
      )}
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
            🌡️ Temperature
          </h4>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-gray-600 dark:text-gray-400">Range:</span>{' '}
              <span className="font-medium text-gray-900 dark:text-white">{targets.temperature.min}–{targets.temperature.max}°{targets.temperature.unit}</span>
            </p>
            {targets.temperature.basking && (
              <p>
                <span className="text-gray-600 dark:text-gray-400">Basking:</span>{' '}
                <span className="font-medium text-gray-900 dark:text-white">{targets.temperature.basking}°{targets.temperature.unit}</span>
              </p>
            )}
            <p className="text-gray-600 dark:text-gray-400 mt-2">{targets.gradient}</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
            💧 Humidity
          </h4>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-gray-600 dark:text-gray-400">Range:</span>{' '}
              <span className="font-medium dark:text-white">{targets.humidity.min}–{targets.humidity.max}{targets.humidity.unit}</span>
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Misters / Foggers are not recommended at all. High humidity increases risk of bacterial and respitory infections.
            </p>
          </div>
        </div>

        <div className="md:col-span-2">
          <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
            💡 Lighting
          </h4>
          <div className="space-y-1 text-sm">
            {targets.lighting.uvbRequired ? (
              <>
                <p>
                  <span className="text-gray-600 dark:text-gray-400">UVB Required:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white">{targets.lighting.uvbStrength} strength</span>
                </p>
                <p>
                  <span className="text-gray-600 dark:text-gray-400">Coverage:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white">{targets.lighting.coveragePercent}% of enclosure length</span>
                </p>
              </>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">UVB not required, but beneficial for overall health</p>
            )}
            <p>
              <span className="text-gray-600 dark:text-gray-400">Photo Period:</span>{' '}
              <span className="font-medium text-gray-900 dark:text-white">{targets.lighting.photoperiod}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
