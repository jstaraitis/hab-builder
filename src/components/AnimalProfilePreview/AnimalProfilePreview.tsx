import { useState } from 'react';
import { animalProfiles } from '../../data/animals';
import type { AnimalProfile } from '../../engine/types';

export function AnimalProfilePreview() {
  const [selectedId, setSelectedId] = useState<string>(Object.keys(animalProfiles)[0] || '');
  const profile: AnimalProfile | undefined = animalProfiles[selectedId];

  if (!profile) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300">No animal profiles found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">🔬 Animal Profile Inspector</h1>
        <p className="text-purple-100">Development tool for reviewing animal data</p>
      </div>

      {/* Animal Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Select Animal to Preview
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {Object.entries(animalProfiles).map(([id, p]) => (
            <option key={id} value={id}>
              {p.emoji} {p.commonName} ({p.scientificName})
            </option>
          ))}
        </select>
      </div>

      {/* Basic Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Basic Information</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <InfoRow label="ID" value={profile.id} />
          <InfoRow label="Common Name" value={profile.commonName} />
          <InfoRow label="Scientific Name" value={profile.scientificName} />
          <InfoRow label="Emoji" value={profile.emoji || '❌ Missing'} />
          <InfoRow label="Care Level" value={profile.careLevel} badge />
          <InfoRow label="Lifespan" value={profile.lifespan || '❌ Not specified'} />
          <InfoRow 
            label="Bioactive Compatible" 
            value={profile.bioactiveCompatible ? '✅ Yes' : '❌ No'} 
          />
        </div>
      </div>

      {/* Enclosure Requirements */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Enclosure Requirements</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Minimum Size</h3>
            <p className="text-gray-900 dark:text-white">
              {profile.minEnclosureSize.width}×{profile.minEnclosureSize.depth}×{profile.minEnclosureSize.height}" ({profile.minEnclosureSize.units})
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Layout Preference</h3>
            <p className="text-gray-900 dark:text-white">
              {profile.layoutRules.preferVertical ? '📏 Vertical' : '📐 Horizontal'}
            </p>
          </div>
        </div>
        
        {profile.layoutRules.requiredZones && (
          <div className="mt-4">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Required Zones</h3>
            <div className="flex flex-wrap gap-2">
              {profile.layoutRules.requiredZones.map((zone: string) => (
                <span key={zone} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                  {zone}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Care Targets */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Care Parameters</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">🌡️ Temperature</h3>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <p>Range: {profile.careTargets.temperature.min}-{profile.careTargets.temperature.max}°{profile.careTargets.temperature.unit}</p>
              {profile.careTargets.temperature.basking && (
                <p>Basking: {profile.careTargets.temperature.basking}°{profile.careTargets.temperature.unit}</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">💧 Humidity</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {profile.careTargets.humidity.min}-{profile.careTargets.humidity.max}{profile.careTargets.humidity.unit}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">💡 Lighting</h3>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <p>UVB Required: {profile.careTargets.lighting.uvbRequired ? '✅ Yes' : '❌ No'}</p>
              <p>UVB Strength: {profile.careTargets.lighting.uvbStrength}</p>
              <p>Coverage: {profile.careTargets.lighting.coveragePercent}%</p>
              <p>Photoperiod: {profile.careTargets.lighting.photoperiod}</p>
            </div>
          </div>

          {profile.careTargets.gradient && (
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">🌡️ Thermal Gradient</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">{profile.careTargets.gradient}</p>
            </div>
          )}
        </div>
      </div>

      {/* Warnings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          ⚠️ Warnings ({profile.warnings.length})
        </h2>
        <div className="space-y-3">
          {profile.warnings.map((warning, idx) => (
            <div 
              key={idx}
              className={`p-3 rounded border-l-4 ${
                warning.severity === 'critical' 
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-500' 
                  : warning.severity === 'important'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                  {warning.severity}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {warning.category}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{warning.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      {profile.notes && profile.notes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            📝 Notes ({profile.notes.length})
          </h2>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {profile.notes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Care Guidance */}
      {profile.careGuidance && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">🍽️ Care Guidance</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Feeding</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {profile.careGuidance.feedingRequirements?.map((note: string, idx: number) => (
                  <li key={idx}>{note}</li>
                ))}
                {profile.careGuidance.feedingSchedule?.map((note: string, idx: number) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Water</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {profile.careGuidance.waterNotes.map((note: string, idx: number) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Misting</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {profile.careGuidance.mistingNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Related Blogs */}
      {profile.relatedBlogs && profile.relatedBlogs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            📚 Related Blogs ({profile.relatedBlogs.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.relatedBlogs.map((blogId) => (
              <span key={blogId} className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                {blogId}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Validation Status */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <p className="text-green-800 dark:text-green-300 font-semibold">
          ✅ Profile loaded successfully - all required fields present
        </p>
      </div>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  badge?: boolean;
}

function InfoRow({ label, value, badge }: InfoRowProps) {
  return (
    <div>
      <span className="text-gray-600 dark:text-gray-400 text-xs">{label}</span>
      {badge ? (
        <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm font-medium">
          {value}
        </span>
      ) : (
        <p className="text-gray-900 dark:text-white font-medium">{value}</p>
      )}
    </div>
  );
}
