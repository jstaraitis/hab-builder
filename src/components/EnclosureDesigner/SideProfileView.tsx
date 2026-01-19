import { useRef, useState } from 'react';

interface EquipmentItem {
  id: string;
  name: string;
  type: 'heat' | 'uvb' | 'water' | 'hide' | 'decor' | 'substrate';
  x: number;
  y: number;
  width: number;
  height: number;
  variant?: string;
}

interface SideProfileViewProps {
  readonly equipment: EquipmentItem[];
  readonly enclosureInput: { width: number; height: number; depth: number };
  readonly showSafeZones: boolean;
  readonly selectedItemId: string | null;
  readonly onItemSelect: (id: string) => void;
  readonly onItemPositionChange: (id: string, y: number) => void;
}

const GRID_SIZE = 20;

export function SideProfileView({
  equipment,
  enclosureInput,
  showSafeZones,
  selectedItemId,
  onItemSelect,
  onItemPositionChange,
}: SideProfileViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragStartY, setDragStartY] = useState(0);

  // Canvas dimensions - side view shows HEIGHT as the vertical axis
  const canvasWidth = 400; // Fixed width for side view
  const canvasHeight = 600; // Show full height of enclosure
  const pixelPerInchHeight = canvasHeight / enclosureInput.height; // Scale height

  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    if (e.button !== 0) return; // Only left click
    
    setIsDragging(true);
    setDraggedItemId(itemId);
    setDragStartY(e.clientY);
    onItemSelect(itemId);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedItemId || !containerRef.current) return;

    const deltaY = e.clientY - dragStartY;
    
    // Find the item and update its Y position
    const item = equipment.find(eq => eq.id === draggedItemId);
    if (!item) return;

    let newY = Math.max(0, item.y + deltaY);
    
    // Snap to grid
    newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
    
    // Clamp to canvas bounds
    newY = Math.min(newY, canvasHeight - item.height);
    
    onItemPositionChange(draggedItemId, newY);
    setDragStartY(e.clientY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedItemId(null);
  };

  const getItemColorClass = (type: string) => {
    switch (type) {
      case 'heat':
        return 'bg-red-100 border-red-400';
      case 'uvb':
        return 'bg-yellow-100 border-yellow-400';
      case 'water':
        return 'bg-blue-100 border-blue-400';
      case 'hide':
        return 'bg-gray-100 border-gray-400';
      case 'substrate':
        return 'bg-amber-100 border-amber-400';
      case 'decor':
        return 'bg-green-100 border-green-400';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'heat': return '🔥';
      case 'uvb': return '☀️';
      case 'water': return '💧';
      case 'hide': return '🏠';
      case 'substrate': return '🪨';
      case 'decor': return '🌿';
      default: return '📦';
    }
  };

  // Calculate vertical zones based on enclosure height
  const baskingZoneHeight = (enclosureInput.height / 3) * pixelPerInchHeight;
  const coolingZoneHeight = (enclosureInput.height / 3) * pixelPerInchHeight;

  return (
    <div className="flex flex-col h-full gap-4">
      <div>
        <h4 className="font-semibold text-gray-800 mb-2">
          Side View (Height Profile) - {enclosureInput.height}")
        </h4>
        <p className="text-xs text-gray-600">
          Shows vertical distribution of equipment. Drag items up/down to adjust height positioning.
        </p>
      </div>

      {/* Side Profile Canvas */}
      <div
        ref={containerRef}
        className="relative border-4 border-gray-900 bg-gradient-to-r from-amber-50 to-green-50 rounded-lg overflow-hidden shadow-lg flex-1"
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-15"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent ${GRID_SIZE - 1}px, #d1d5db ${GRID_SIZE - 1}px, #d1d5db ${GRID_SIZE}px),
              repeating-linear-gradient(90deg, transparent, transparent ${GRID_SIZE - 1}px, #d1d5db ${GRID_SIZE - 1}px, #d1d5db ${GRID_SIZE}px)
            `,
          }}
        ></div>

        {/* Vertical Zone Overlays */}
        {showSafeZones && (
          <>
            {/* Canopy Zone - Top third */}
            <div className="absolute top-0 left-0 right-0 border-b-2 border-dashed border-amber-500 opacity-30 pointer-events-none" style={{ height: `${baskingZoneHeight}px` }}></div>
            <div className="absolute top-2 left-2 text-xs font-bold text-amber-700 bg-amber-100/90 px-2 py-1 rounded pointer-events-none">
              🌳 Canopy
            </div>

            {/* Mid Zone - Middle third */}
            <div
              className="absolute left-0 right-0 border-b-2 border-dashed border-green-400 opacity-20 pointer-events-none"
              style={{
                top: `${baskingZoneHeight}px`,
                height: `${canvasHeight - baskingZoneHeight - coolingZoneHeight}px`,
              }}
            ></div>
            <div
              className="absolute left-2 text-xs font-bold text-green-700 bg-green-100/90 px-2 py-1 rounded pointer-events-none"
              style={{ top: `${baskingZoneHeight + 10}px` }}
            >
              🌿 Active
            </div>

            {/* Ground Zone - Bottom third */}
            <div
              className="absolute left-0 right-0 bottom-0 border-t-2 border-dashed border-blue-500 opacity-30 pointer-events-none"
              style={{ height: `${coolingZoneHeight}px` }}
            ></div>
            <div className="absolute bottom-2 left-2 text-xs font-bold text-blue-700 bg-blue-100/90 px-2 py-1 rounded pointer-events-none">
              🪨 Ground
            </div>
          </>
        )}

        {/* Substrate base line */}
        <div
          className="absolute left-0 right-0 border-t-4 border-amber-900/60 bg-gradient-to-t from-amber-700/30 to-transparent pointer-events-none"
          style={{
            bottom: 0,
            height: `${40 * pixelPerInchHeight}px`,
          }}
        >
          <div className="absolute bottom-2 left-2 text-xs font-bold text-amber-900/70">Substrate</div>
        </div>

        {/* Equipment items positioned by HEIGHT (Y-axis) and DEPTH (X-axis) */}
        {equipment
          .filter(item => item.type !== 'substrate') // Don't show substrate in side view, it's the base
          .map((item) => {
            // Position: Y becomes the vertical position (height in enclosure)
            // X becomes the horizontal position (depth front-to-back)
            const topPos = item.y; // Already scaled to canvas coords
            const leftPos = (item.x / 800) * canvasWidth; // Map from top-view X to side-view horizontal
            const itemHeight = Math.max(20, (item.height / 600) * canvasHeight);

            const isSelected = selectedItemId === item.id;

            return (
              <div
                key={item.id}
                className={`absolute cursor-grab active:cursor-grabbing rounded border-2 flex items-center justify-center text-xs font-semibold transition-all ${getItemColorClass(
                  item.type
                )} ${isSelected ? 'ring-3 ring-green-500 shadow-lg shadow-green-400/60' : 'ring-1 ring-gray-400'}`}
                style={{
                  top: `${topPos}px`,
                  left: `${leftPos}px`,
                  width: `${Math.max(30, item.width / 3)}px`, // Smaller in side view
                  height: `${itemHeight}px`,
                  zIndex: isSelected ? 50 : 10,
                }}
                onMouseDown={(e) => handleMouseDown(e, item.id)}
                onClick={() => onItemSelect(item.id)}
                title={`${item.name} (Height: ${item.y}px, Depth: ${leftPos.toFixed(0)}px)`}
              >
                <span className="text-lg">{getItemIcon(item.type)}</span>
              </div>
            );
          })}

        {/* Height scale labels */}
        <div className="absolute left-1 top-2 text-xs font-bold text-gray-600 bg-white/80 px-1 py-0 rounded">
          Top
        </div>
        <div className="absolute left-1 bottom-2 text-xs font-bold text-gray-600 bg-white/80 px-1 py-0 rounded">
          Bottom
        </div>

        {/* Depth scale labels */}
        <div className="absolute top-1 left-2 text-xs font-bold text-gray-600 bg-white/80 px-1 py-0 rounded">
          Front
        </div>
        <div className="absolute top-1 right-2 text-xs font-bold text-gray-600 bg-white/80 px-1 py-0 rounded">
          Back
        </div>
      </div>

      {/* Help text */}
      <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded p-2">
        💡 <strong>Tip:</strong> Drag items vertically to adjust their height in the enclosure. View shows Front (left) to Back (right) depth perspective.
      </div>
    </div>
  );
}
