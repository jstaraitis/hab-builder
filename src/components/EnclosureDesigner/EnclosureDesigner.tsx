import { useState, useRef } from 'react';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import html2canvas from 'html2canvas';
import type { ShoppingItem, EnclosureInput } from '../../engine/types';

interface EquipmentItem {
  id: string;
  name: string;
  type: 'heat' | 'uvb' | 'water' | 'hide' | 'decor' | 'substrate';
  x: number;
  y: number;
  width: number;
  height: number;
  variant?: string; // 'fern', 'vine', 'bush', 'tree', 'grass' for decor
}

interface EnclosureDesignerProps {
  readonly enclosureInput: EnclosureInput;
  readonly shoppingList: ShoppingItem[];
}

function DraggableEquipment({ item, onDelete, onVariantChange, isSelected, onToggleSelection }: { readonly item: EquipmentItem; readonly onDelete: (id: string) => void; readonly onVariantChange: (id: string, variant: string) => void; readonly isSelected: boolean; readonly onToggleSelection: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: item.id,
  });

  const style = {
    left: `${item.x}px`,
    top: `${item.y}px`,
    width: `${item.width}px`,
    minHeight: `${item.height}px`,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  // Icon mapping for better visual representation
  const iconMap = {
    heat: '🔥',
    uvb: '☀️',
    water: '💧',
    hide: '🏠',
    decor: '🌿',
    substrate: '🪨',
  };

  const bgColor = {
    heat: 'bg-red-100 border-red-400',
    uvb: 'bg-yellow-100 border-yellow-400',
    water: 'bg-blue-100 border-blue-400',
    hide: 'bg-gray-100 border-gray-400',
    decor: 'bg-green-100 border-green-400',
    substrate: 'bg-amber-100 border-amber-400',
  }[item.type];

  const [showDelete, setShowDelete] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(item.id);
  };

  // Render shape based on item type
  const renderShape = () => {
    switch (item.type) {
      case 'heat':
        // Bulb shape for heat lamp
        return (
          <svg viewBox="0 0 40 50" className="w-full h-full">
            <circle cx="20" cy="15" r="12" fill="#ff6b35" stroke="#ff4500" strokeWidth="2" />
            <rect x="18" y="25" width="4" height="8" fill="#666" />
            <rect x="15" y="32" width="10" height="2" fill="#666" />
          </svg>
        );
      case 'uvb':
        // Linear bar for UVB fixture
        return (
          <svg viewBox="0 0 100 20" className="w-full h-full">
            <rect x="2" y="5" width="96" height="10" rx="5" fill="#ffd700" stroke="#ffb300" strokeWidth="1" />
            <circle cx="20" cy="10" r="3" fill="#fff" opacity="0.6" />
            <circle cx="50" cy="10" r="3" fill="#fff" opacity="0.6" />
            <circle cx="80" cy="10" r="3" fill="#fff" opacity="0.6" />
          </svg>
        );
      case 'water':
        // Bowl/dish shape
        return (
          <svg viewBox="0 0 60 40" className="w-full h-full">
            <path d="M 10 20 Q 10 30 30 32 Q 50 30 50 20" fill="#87ceeb" stroke="#4a90e2" strokeWidth="2" />
            <path d="M 10 20 Q 10 12 30 10 Q 50 12 50 20" fill="#b0e0e6" stroke="#4a90e2" strokeWidth="2" />
          </svg>
        );
      case 'hide':
        // Cave/box shape
        return (
          <svg viewBox="0 0 60 40" className="w-full h-full">
            <rect x="5" y="8" width="50" height="28" rx="4" fill="#8b7355" stroke="#654321" strokeWidth="2" />
            <ellipse cx="20" cy="25" rx="8" ry="10" fill="#654321" />
            <circle cx="15" cy="20" r="2" fill="#333" />
          </svg>
        );
      case 'decor': {
        // Plant/branch shape - variants based on plant type
        const plantVariant = item.variant || 'bush';
        if (plantVariant === 'fern') {
          return (
            <svg viewBox="0 0 40 60" className="w-full h-full">
              <line x1="20" y1="55" x2="20" y2="20" stroke="#654321" strokeWidth="1.5" />
              <path d="M 15 45 Q 18 40 20 35 Q 22 40 25 45" fill="none" stroke="#22c55e" strokeWidth="2" />
              <path d="M 14 50 Q 18 43 20 38 Q 22 43 26 50" fill="none" stroke="#16a34a" strokeWidth="2" />
              <path d="M 13 55 Q 18 46 20 40 Q 22 46 27 55" fill="none" stroke="#22c55e" strokeWidth="2" />
            </svg>
          );
        } else if (plantVariant === 'vine') {
          return (
            <svg viewBox="0 0 40 60" className="w-full h-full">
              <path d="M 20 55 Q 15 45 20 35 Q 25 25 20 15" fill="none" stroke="#654321" strokeWidth="2" />
              <circle cx="15" cy="40" r="3" fill="#22c55e" />
              <circle cx="25" cy="30" r="3" fill="#22c55e" />
              <circle cx="18" cy="20" r="3" fill="#16a34a" />
              <circle cx="22" cy="50" r="3" fill="#22c55e" />
            </svg>
          );
        } else if (plantVariant === 'tree') {
          return (
            <svg viewBox="0 0 40 60" className="w-full h-full">
              <line x1="20" y1="55" x2="20" y2="28" stroke="#8b4513" strokeWidth="2" />
              <circle cx="20" cy="15" r="10" fill="#16a34a" />
              <circle cx="12" cy="20" r="7" fill="#22c55e" />
              <circle cx="28" cy="20" r="7" fill="#22c55e" />
            </svg>
          );
        } else if (plantVariant === 'grass') {
          return (
            <svg viewBox="0 0 40 40" className="w-full h-full">
              <line x1="10" y1="35" x2="8" y2="15" stroke="#22c55e" strokeWidth="1.5" />
              <line x1="20" y1="35" x2="20" y2="10" stroke="#16a34a" strokeWidth="2" />
              <line x1="30" y1="35" x2="32" y2="15" stroke="#22c55e" strokeWidth="1.5" />
              <line x1="15" y1="35" x2="12" y2="18" stroke="#22c55e" strokeWidth="1.5" />
              <line x1="25" y1="35" x2="28" y2="18" stroke="#22c55e" strokeWidth="1.5" />
            </svg>
          );
        } else {
          // Default bush
          return (
            <svg viewBox="0 0 40 50" className="w-full h-full">
              <line x1="20" y1="45" x2="20" y2="28" stroke="#654321" strokeWidth="2" />
              <circle cx="20" cy="20" r="12" fill="#22c55e" />
              <circle cx="12" cy="25" r="9" fill="#16a34a" />
              <circle cx="28" cy="25" r="9" fill="#16a34a" />
            </svg>
          );
        }
      }
      case 'substrate': {
        // Wide ground layer
        return (
          <svg viewBox="0 0 100 30" className="w-full h-full">
            <rect x="0" y="0" width="100" height="30" fill="#a67c52" stroke="#6b5344" strokeWidth="1" />
            <circle cx="15" cy="8" r="2" fill="#8b6f47" opacity="0.5" />
            <circle cx="35" cy="12" r="2.5" fill="#8b6f47" opacity="0.5" />
            <circle cx="55" cy="9" r="2" fill="#8b6f47" opacity="0.5" />
            <circle cx="75" cy="13" r="2.5" fill="#8b6f47" opacity="0.5" />
            <circle cx="25" cy="20" r="1.5" fill="#7a5f3c" opacity="0.5" />
            <circle cx="50" cy="22" r="2" fill="#7a5f3c" opacity="0.5" />
            <circle cx="80" cy="20" r="1.5" fill="#7a5f3c" opacity="0.5" />
          </svg>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`absolute p-0 text-xs font-medium text-center flex items-center justify-center group hover:z-50 transition-all ${isSelected && item.type === 'decor' ? 'ring-2 ring-purple-500' : ''}`}
      data-equipment-id={item.id}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      title={item.type === 'decor' ? 'Click to change plant style' : ''}
    >
      {/* Item shadow for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 rounded pointer-events-none"></div>
      <div
        {...listeners}
        {...attributes}
        className="cursor-move w-full h-full flex items-center justify-center relative"
      >
        {renderShape()}
      </div>

      {/* Edit button for decor items */}
      {item.type === 'decor' && (
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSelection(item.id);
          }}
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-purple-500 hover:bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 z-50 opacity-0 group-hover:opacity-100"
          title="Edit plant style"
          type="button"
        >
          ✎
        </button>
      )}

      {/* Plant variant selector for decor items */}
      {isSelected && item.type === 'decor' && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border-2 border-purple-500 rounded-lg shadow-lg p-2 z-50 whitespace-nowrap">
          <div className="text-xs font-bold text-purple-700 mb-1">Plant Style:</div>
          <div className="flex gap-1">
            {['bush', 'fern', 'vine', 'tree', 'grass'].map((variant) => (
              <button
                key={variant}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onVariantChange(item.id, variant);
                }}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  (item.variant || 'bush') === variant
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {variant.charAt(0).toUpperCase() + variant.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {showDelete && (
        <button
          onMouseDown={handleDelete}
          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 z-50"
          title="Delete item"
          type="button"
        >
          ×
        </button>
      )}
    </div>
  );
}

function DroppableEnclosure({ children, enclosureRef }: { readonly children: React.ReactNode; readonly enclosureRef: React.RefObject<HTMLDivElement> }) {
  const { setNodeRef } = useDroppable({
    id: 'enclosure',
  });

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (enclosureRef.current === null && node) {
          (enclosureRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      }}
      className="relative border-8 border-gray-900 bg-gradient-to-br from-amber-50 to-green-50 rounded-lg overflow-hidden shadow-2xl"
      style={{ 
        width: '100%', 
        paddingBottom: '75%',
        boxShadow: 'inset -2px -2px 8px rgba(0,0,0,0.3), inset 2px 2px 8px rgba(255,255,255,0.5), 0 10px 30px rgba(0,0,0,0.3)'
      }}
    >
      {/* Glass shine/reflection effect */}
      <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-white/40 to-transparent pointer-events-none rounded-t-md"></div>
      
      {children}
    </div>
  );
}

export function EnclosureDesigner({ enclosureInput, shoppingList }: EnclosureDesignerProps) {
  const enclosureRef = useRef<HTMLDivElement | null>(null);
  const GRID_SIZE = 20; // Snap to 20px grid
  
  // Helper to snap to grid
  const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;
  
  // Initialize equipment from shopping list with smart placement
  const [equipment, setEquipment] = useState<EquipmentItem[]>(() => {
    const items: EquipmentItem[] = [];
    const enclosureWidth = 800; // Canvas width in px (width of enclosure)
    const enclosureHeight = 600; // Canvas height in px (height of enclosure)
    
    // Categorize items
    const heatItems: EquipmentItem[] = [];
    const uvbItems: EquipmentItem[] = [];
    const waterItems: EquipmentItem[] = [];
    const hideItems: EquipmentItem[] = [];
    const decorItems: EquipmentItem[] = [];

    shoppingList.forEach((item, idx) => {
      let type: EquipmentItem['type'] = 'decor';
      
      if (item.name.toLowerCase().includes('heat') || item.name.toLowerCase().includes('lamp') || item.name.toLowerCase().includes('basking')) {
        type = 'heat';
      } else if (item.name.toLowerCase().includes('uvb') || item.name.toLowerCase().includes('light') || item.name.toLowerCase().includes('fixture')) {
        type = 'uvb';
      } else if (item.name.toLowerCase().includes('water') || item.name.toLowerCase().includes('dish') || item.name.toLowerCase().includes('bowl')) {
        type = 'water';
      } else if (item.name.toLowerCase().includes('hide') || item.name.toLowerCase().includes('cave') || item.name.toLowerCase().includes('shelter')) {
        type = 'hide';
      } else if (item.name.toLowerCase().includes('substrate')) {
        type = 'substrate';
      }

      const equipItem: EquipmentItem = {
        id: `equipment-${idx}`,
        name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
        type,
        x: 0,
        y: 0,
        width: type === 'uvb' ? 140 : type === 'substrate' ? 180 : type === 'water' ? 85 : 100,
        height: type === 'substrate' ? 70 : type === 'uvb' ? 35 : 55,
      };

      // Categorize
      if (type === 'heat') heatItems.push(equipItem);
      else if (type === 'uvb') uvbItems.push(equipItem);
      else if (type === 'water') waterItems.push(equipItem);
      else if (type === 'hide') hideItems.push(equipItem);
      else decorItems.push(equipItem);
    });

    // Smart placement algorithm - FRONT VIEW
    // Heat items: bottom-left (warm side, on ground level)
    heatItems.forEach((item, idx) => {
      item.x = snapToGrid(40 + (idx % 2) * 140);
      item.y = snapToGrid(enclosureHeight - 120 - Math.floor(idx / 2) * 80);
      items.push(item);
    });

    // UVB items: top-center (spanning across top for basking light)
    uvbItems.forEach((item, idx) => {
      item.x = snapToGrid(enclosureWidth / 2 - item.width / 2);
      item.y = snapToGrid(20 + idx * 70);
      items.push(item);
    });

    // Water items: bottom-right (cool side, on ground level)
    waterItems.forEach((item, idx) => {
      item.x = snapToGrid(enclosureWidth - 140 - (idx % 2) * 120);
      item.y = snapToGrid(enclosureHeight - 120 - Math.floor(idx / 2) * 80);
      items.push(item);
    });

    // Hides: mid-level on both sides
    hideItems.forEach((item, idx) => {
      if (idx % 2 === 0) {
        // Left side hide
        item.x = snapToGrid(40);
        item.y = snapToGrid(enclosureHeight / 2 - 50 + Math.floor(idx / 2) * 80);
      } else {
        // Right side hide
        item.x = snapToGrid(enclosureWidth - 140);
        item.y = snapToGrid(enclosureHeight / 2 - 50 + Math.floor(idx / 2) * 80);
      }
      items.push(item);
    });

    // Decor: scatter in middle area
    decorItems.forEach((item, idx) => {
      item.x = snapToGrid(enclosureWidth / 2 - 50 + (idx % 3 - 1) * 100);
      item.y = snapToGrid(enclosureHeight / 2 - 50 + Math.floor(idx / 3) * 100);
      items.push(item);
    });

    return items;
  });

  const [warnings, setWarnings] = useState<string[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<EquipmentItem['type']>('decor');
  const [showGrid, setShowGrid] = useState(true);
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const addCustomItem = () => {
    if (!newItemName.trim()) return;

    const customItem: EquipmentItem = {
      id: `equipment-custom-${Date.now()}`,
      name: newItemName,
      type: newItemType,
      x: snapToGrid(200),
      y: snapToGrid(200),
      width: newItemType === 'substrate' ? 150 : 90,
      height: newItemType === 'substrate' ? 60 : 45,
    };

    setEquipment((items) => [...items, customItem]);
    setNewItemName('');
    setNewItemType('decor');
    setTimeout(() => checkWarnings(), 0);
  };

  const removeItem = (id: string) => {
    setEquipment((items) => items.filter((item) => item.id !== id));
    setTimeout(() => checkWarnings(), 0);
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItemId((current) => (current === id ? null : id));
  };

  const updateItemVariant = (id: string, variant: string) => {
    setEquipment((items) =>
      items.map((item) =>
        item.id === id ? { ...item, variant } : item
      )
    );
    setSelectedItemId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    
    setEquipment((items) =>
      items.map((item) => {
        if (item.id === active.id) {
          // Apply delta and snap to grid
          const newX = snapToGrid(Math.max(0, item.x + delta.x));
          const newY = snapToGrid(Math.max(0, item.y + delta.y));
          
          return {
            ...item,
            x: newX,
            y: newY,
          };
        }
        return item;
      })
    );

    // Check for warnings after position update
    setTimeout(() => checkWarnings(), 0);
  };

  const checkWarnings = () => {
    const newWarnings: string[] = [];
    const enclosureWidth = enclosureRef.current?.offsetWidth || 800;
    const enclosureHeight = enclosureRef.current?.offsetHeight || 600;
    
    const heatItems = equipment.filter((e) => e.type === 'heat');
    const uvbItems = equipment.filter((e) => e.type === 'uvb');
    const waterItems = equipment.filter((e) => e.type === 'water');
    const hideItems = equipment.filter((e) => e.type === 'hide');
    
    // Check heat/water proximity
    heatItems.forEach((heat) => {
      waterItems.forEach((water) => {
        const distance = Math.sqrt(
          Math.pow(heat.x - water.x, 2) + Math.pow(heat.y - water.y, 2)
        );
        if (distance < 150) {
          newWarnings.push('⚠️ Heat source too close to water - causes rapid evaporation and humidity issues');
        }
      });
    });

    // Check if heat is on warm side (left half)
    heatItems.forEach((heat) => {
      if (heat.x > enclosureWidth / 2) {
        newWarnings.push('⚠️ Heat lamp on cool side - should be placed on warm side (left) for proper gradient');
      }
    });

    // Check if water is away from heat
    waterItems.forEach((water) => {
      if (water.x < enclosureWidth / 3) {
        newWarnings.push('💡 Consider moving water dish to cool side (right) to maintain stable hydration');
      }
    });

    // Check UVB presence and positioning
    if (uvbItems.length === 0) {
      newWarnings.push('⚠️ No UVB fixture - required for most diurnal reptiles');
    } else {
      uvbItems.forEach((uvb) => {
        // UVB should be near top
        if (uvb.y > enclosureHeight / 3) {
          newWarnings.push('⚠️ UVB fixture too low - should be positioned at top of enclosure for proper coverage');
        }
      });
    }

    // Check hide distribution
    if (hideItems.length === 0) {
      newWarnings.push('⚠️ No hides placed - animals need secure hiding spots');
    } else if (hideItems.length === 1) {
      newWarnings.push('💡 Add a second hide on the opposite temperature zone for better thermoregulation');
    } else {
      // Check if hides are on both sides
      const warmSideHides = hideItems.filter(h => h.x < enclosureWidth / 2);
      const coolSideHides = hideItems.filter(h => h.x >= enclosureWidth / 2);
      
      if (warmSideHides.length === 0) {
        newWarnings.push('💡 Add a hide on warm side (left) - animals need secure basking spots');
      }
      if (coolSideHides.length === 0) {
        newWarnings.push('💡 Add a hide on cool side (right) - animals need secure cooling spots');
      }
    }

    // Check for overlapping items
    equipment.forEach((item1, idx1) => {
      equipment.forEach((item2, idx2) => {
        if (idx1 >= idx2) return; // Skip self and already-checked pairs
        
        const overlapX = Math.abs(item1.x - item2.x) < (item1.width + item2.width) / 2;
        const overlapY = Math.abs(item1.y - item2.y) < (item1.height + item2.height) / 2;
        
        if (overlapX && overlapY) {
          newWarnings.push(`⚠️ Items overlapping: "${item1.name}" and "${item2.name}"`);
        }
      });
    });

    setWarnings([...new Set(newWarnings)]); // Remove duplicates
  };

  const handleExportImage = async () => {
    if (!enclosureRef.current) return;
    
    try {
      const canvas = await html2canvas(enclosureRef.current);
      const dataUrl = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.download = `enclosure-design-${enclosureInput.animal}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export image:', error);
    }
  };

  const resetLayout = () => {
    setEquipment((items) =>
      items.map((item, idx) => ({
        ...item,
        x: 10,
        y: 10 + idx * 50,
      }))
    );
    setWarnings([]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">🎨 Interactive Enclosure Designer</h3>
        <p className="text-sm text-blue-800">
          Drag equipment items to design your enclosure layout. Visual zones show temperature gradients.
        </p>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Enclosure Canvas */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex justify-between items-center">
              <h4 className="font-semibold text-gray-800">
                Front View ({enclosureInput.width}×{enclosureInput.height}")
              </h4>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${showGrid ? 'bg-gray-400 text-white' : 'bg-gray-200 text-gray-700'}`}
                  title="Toggle grid"
                >
                  {showGrid ? '▦' : '▢'} Grid
                </button>
                <button
                  onClick={() => setShowSafeZones(!showSafeZones)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${showSafeZones ? 'bg-purple-400 text-white' : 'bg-gray-200 text-gray-700'}`}
                  title="Toggle safe zones"
                >
                  🎯 Zones
                </button>
                <button
                  onClick={resetLayout}
                  className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handleExportImage}
                  className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                >
                  📷 Export
                </button>
              </div>
            </div>

            <DroppableEnclosure enclosureRef={enclosureRef}>
              {/* Grid overlay - toggle with showGrid */}
              {showGrid && (
                <div 
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    backgroundImage: `
                      repeating-linear-gradient(0deg, transparent, transparent ${GRID_SIZE - 1}px, #d1d5db ${GRID_SIZE - 1}px, #d1d5db ${GRID_SIZE}px),
                      repeating-linear-gradient(90deg, transparent, transparent ${GRID_SIZE - 1}px, #d1d5db ${GRID_SIZE - 1}px, #d1d5db ${GRID_SIZE}px)
                    `
                  }}
                ></div>
              )}
              
              {/* Lighting effects - glow from heat and UVB */}
              {equipment
                .filter((e) => e.type === 'heat')
                .map((heat) => (
                  <div
                    key={`heat-glow-${heat.id}`}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${heat.x + heat.width / 2}px`,
                      top: `${heat.y}px`,
                      width: '200px',
                      height: '200px',
                      background: 'radial-gradient(circle, rgba(255,100,50,0.4) 0%, rgba(255,100,50,0.2) 50%, transparent 70%)',
                      transform: 'translate(-50%, -50%)',
                      filter: 'blur(30px)',
                    }}
                  ></div>
                ))}
              
              {/* UVB light beam effect */}
              {equipment
                .filter((e) => e.type === 'uvb')
                .map((uvb) => (
                  <div
                    key={`uvb-glow-${uvb.id}`}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${uvb.x + uvb.width / 2}px`,
                      top: `${uvb.y + uvb.height}px`,
                      width: `${uvb.width * 1.5}px`,
                      height: '250px',
                      background: 'linear-gradient(180deg, rgba(255,250,100,0.3) 0%, rgba(255,250,100,0.1) 60%, transparent 100%)',
                      transform: 'translateX(-50%)',
                      pointerEvents: 'none',
                    }}
                  ></div>
                ))}
              {showSafeZones && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Basking zone - top left (warm side, near UVB) */}
                  <div className="absolute left-0 top-0 w-1/2 h-1/3 border-2 border-dashed border-red-400 opacity-30"></div>
                  <div className="absolute left-2 top-2 text-xs font-semibold text-red-600 bg-white/70 px-2 py-1 rounded">
                    🔆 Basking Zone
                  </div>
                  
                  {/* Climbing/Activity zone - center */}
                  <div className="absolute left-1/4 top-1/4 w-1/2 h-1/2 border-2 border-dashed border-green-400 opacity-20"></div>
                  
                  {/* Cooling zone - bottom right */}
                  <div className="absolute right-0 bottom-0 w-1/2 h-1/3 border-2 border-dashed border-blue-400 opacity-30"></div>
                  <div className="absolute right-2 bottom-2 text-xs font-semibold text-blue-600 bg-white/70 px-2 py-1 rounded">
                    ❄️ Cool Zone
                  </div>
                </div>
              )}

              {/* Temperature gradient zones */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-gradient-to-r from-red-400/20 to-red-400/5"></div>
                <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-blue-400/20 to-blue-400/5"></div>
              </div>
              
              {/* Floor line - represents the ground surface with texture */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-16 border-t-4 border-b-2 border-amber-900/60 bg-gradient-to-b from-amber-700/40 to-amber-900/50 pointer-events-none"
                style={{
                  backgroundImage: `
                    repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(120,80,40,0.3) 2px, rgba(120,80,40,0.3) 4px),
                    repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(120,80,40,0.2) 3px, rgba(120,80,40,0.2) 6px)
                  `
                }}
              >
                <div className="absolute bottom-2 left-2 text-xs font-bold text-amber-900/70">🪨 Substrate</div>
              </div>
              
              {/* Height indicator - shows vertical scale */}
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-700 bg-white/90 px-2 py-1 rounded shadow-sm">
                Height
              </div>
              
              <div className="absolute top-2 left-2 text-xs font-semibold text-red-700 bg-white/90 px-2 py-1 rounded shadow-sm">
                🔥 Warm Side
              </div>
              <div className="absolute top-2 right-2 text-xs font-semibold text-blue-700 bg-white/90 px-2 py-1 rounded shadow-sm">
                ❄️ Cool Side
              </div>

              {/* Draggable equipment items */}
              {equipment.map((item) => (
                <DraggableEquipment 
                  key={item.id} 
                  item={item} 
                  onDelete={removeItem}
                  onVariantChange={updateItemVariant}
                  onToggleSelection={toggleItemSelection}
                  isSelected={selectedItemId === item.id}
                />
              ))}
            </DroppableEnclosure>
          </div>

          {/* Warnings & Legend */}
          <div className="space-y-4">
            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Design Warnings</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Legend */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Legend</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-400 rounded"></div>
                  <span>Heat Equipment</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-400 rounded"></div>
                  <span>UVB Lighting</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-400 rounded"></div>
                  <span>Water Features</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 border border-gray-400 rounded"></div>
                  <span>Hides</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-400 rounded"></div>
                  <span>Decor/Plants</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">💡 Design Tips</h4>
              <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                <li>Place heat on one side for thermal gradient</li>
                <li>Position hides on both warm and cool sides</li>
                <li>Keep water dish away from heat sources</li>
                <li>UVB should cover basking area</li>
              </ul>
            </div>

            {/* Add Custom Items */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-3">➕ Add Custom Item</h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Item name (e.g., 'Ficus Plant')"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomItem()}
                  className="w-full px-2 py-1 text-sm border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <select
                  value={newItemType}
                  onChange={(e) => setNewItemType(e.target.value as EquipmentItem['type'])}
                  className="w-full px-2 py-1 text-sm border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="decor">🌿 Plant / Decor</option>
                  <option value="substrate">🪨 Substrate / Bedding</option>
                  <option value="hide">🏠 Hide / Shelter</option>
                  <option value="water">💧 Water Feature</option>
                  <option value="heat">🔥 Heat Element</option>
                  <option value="uvb">☀️ UVB Light</option>
                </select>
                <button
                  onClick={addCustomItem}
                  disabled={!newItemName.trim()}
                  className="w-full px-3 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded transition-colors"
                >
                  Add Item
                </button>
              </div>
              <p className="text-xs text-purple-700 mt-2">
                💡 Tip: Add plants, branches, climbing perches, thermometers, and more!
              </p>
            </div>
          </div>
        </div>
      </DndContext>
    </div>
  );
}
