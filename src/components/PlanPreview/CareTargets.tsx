import type { CareTargets as CareTargetsType } from '../../engine/types';

interface CareTargetsProps {
  targets: CareTargetsType;
  showHeader?: boolean;
}

export function CareTargets({ targets, showHeader = true }: CareTargetsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {showHeader && (
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Care Parameters</h3>
      )}
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            🌡️ Temperature
          </h4>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-gray-600">Range:</span>{' '}
              <span className="font-medium">{targets.temperature.min}–{targets.temperature.max}°{targets.temperature.unit}</span>
            </p>
            {targets.temperature.basking && (
              <p>
                <span className="text-gray-600">Basking:</span>{' '}
                <span className="font-medium">{targets.temperature.basking}°{targets.temperature.unit}</span>
              </p>
            )}
            <p className="text-gray-600 mt-2">{targets.gradient}</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            💧 Humidity
          </h4>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-gray-600">Range:</span>{' '}
              <span className="font-medium">{targets.humidity.min}–{targets.humidity.max}{targets.humidity.unit}</span>
            </p>
            <p className="text-gray-600 mt-2">
              Mist enclosure 1-2 times daily, more during shedding
            </p>
          </div>
        </div>

        <div className="md:col-span-2">
          <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            💡 Lighting
          </h4>
          <div className="space-y-1 text-sm">
            {targets.lighting.uvbRequired ? (
              <>
                <p>
                  <span className="text-gray-600">UVB Required:</span>{' '}
                  <span className="font-medium">{targets.lighting.uvbStrength} strength</span>
                </p>
                <p>
                  <span className="text-gray-600">Coverage:</span>{' '}
                  <span className="font-medium">{targets.lighting.coveragePercent}% of enclosure length</span>
                </p>
              </>
            ) : (
              <p className="text-gray-600">UVB not required, but beneficial for overall health</p>
            )}
            <p>
              <span className="text-gray-600">Photo Period:</span>{' '}
              <span className="font-medium">{targets.lighting.photoperiod}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
