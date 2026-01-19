import type { VerticalLayer } from '../../engine/types';

interface SideViewLayoutProps {
  layers: VerticalLayer[];
}

/**
 * Side-View Layout Component - displays vertical layers for arboreal species
 * Shows substrate, mid-level branches, and canopy zones in a simplified format
 */
export function SideViewLayout({ layers }: SideViewLayoutProps) {
  if (!layers || layers.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 border-2 border-gray-300">
        <p className="text-gray-600">Side-View Layout (Vertical Layers)</p>
        <p className="text-sm text-gray-500 mt-2">No vertical layer data available for this species.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 rounded-lg p-6 border-2 border-gray-300">
      <p className="text-gray-600 mb-4 font-semibold">Side-View Layout (Vertical Layers)</p>
      <div className="space-y-3">
        {layers.map((layer) => (
          <div key={`layer-${layer.id}`} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-800">{layer.name}</p>
                <p className="text-sm text-gray-600 mt-1">{layer.description}</p>
              </div>
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {layer.heightPercent}% height
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
