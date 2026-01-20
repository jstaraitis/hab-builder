import { useState, useRef } from 'react';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import html2canvas from 'html2canvas';
import { Flame, Sun, Droplets, Mountain, TreeDeciduous, Sprout, Leaf, Trees, Warehouse } from 'lucide-react';
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
  rotation?: number; // rotation in degrees
  scale?: number; // scale factor (1 = 100%)
}

interface EnclosureDesignerProps {
  readonly enclosureInput: EnclosureInput;
  readonly shoppingList: ShoppingItem[];
}

function DraggableEquipment({ item, onDelete, onVariantChange, isSelected, onToggleSelection, onResize, onRotate }: { readonly item: EquipmentItem; readonly onDelete: (id: string) => void; readonly onVariantChange: (id: string, variant: string) => void; readonly isSelected: boolean; readonly onToggleSelection: (id: string) => void; readonly onResize: (id: string, scale: number) => void; readonly onRotate: (id: string, rotation: number) => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: item.id,
  });

  const rotation = item.rotation || 0;
  const scale = item.scale || 1;

  const style = {
    left: `${item.x}px`,
    top: `${item.y}px`,
    width: `${item.width}px`,
    minHeight: `${item.height}px`,
    transform: transform 
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${rotation}deg) scale(${scale})`
      : `rotate(${rotation}deg) scale(${scale})`,
    transformOrigin: 'center center',
  };

  const [showDelete, setShowDelete] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(item.id);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startScale = scale;
    const startX = e.clientX;
    const startY = e.clientY;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      const delta = (deltaX + deltaY) / 200; // Average of x and y movement
      const newScale = Math.max(0.5, Math.min(3, startScale + delta));
      onResize(item.id, newScale);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleRotateStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRotating(true);
    
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) return;
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startRotation = rotation;
    
    // Calculate initial angle from center to mouse
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate current angle from center to mouse
      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      let angleDelta = currentAngle - startAngle;
      let newRotation = (startRotation + angleDelta) % 360;
      
      // Normalize to 0-360 range
      if (newRotation < 0) newRotation += 360;
      
      // Snap to common angles (0, 45, 90, 135, 180, 225, 270, 315) if within 5 degrees
      const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315];
      for (const snapAngle of snapAngles) {
        if (Math.abs(newRotation - snapAngle) < 5) {
          newRotation = snapAngle;
          break;
        }
      }
      
      onRotate(item.id, newRotation);
    };
    
    const handleMouseUp = () => {
      setIsRotating(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Render shape based on item type - use image if available, fallback to icons
  const [imageError, setImageError] = useState(false);

  const renderShape = () => {
    const iconSize = item.type === 'substrate' ? 48 : item.type === 'uvb' ? 36 : 42;
    const iconColor = (() => {
      switch (item.type) {
        case 'heat': return '#ff6b35';
        case 'uvb': return '#ffd700';
        case 'water': return '#4fc3f7';
        case 'hide': return '#8b7355';
        case 'substrate': return '#a67c52';
        case 'decor': return '#22c55e';
        default: return '#666';
      }
    })();

    // Only use images for decor items with tree variant (and if image hasn't failed)
    const useImage = item.type === 'decor' && item.variant === 'tree' && !imageError;
    
    if (useImage) {
      const imagePath = '/equipment/plants/tree.png';
      
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <img 
            src={imagePath} 
            alt={item.name}
            className="relative z-10 object-contain max-w-full max-h-full p-1"
            style={{ filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3))' }}
            onError={() => {
              console.error(`Failed to load image: ${imagePath}`);
              setImageError(true);
            }}
          />
        </div>
      );
    }

    // Use Lucide icons for everything else
    switch (item.type) {
      case 'heat':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-orange-400/30 blur-xl animate-pulse"></div>
            </div>
            <Flame size={iconSize} color={iconColor} fill={iconColor} strokeWidth={2.5} className="relative z-10" />
          </div>
        );
      
      case 'uvb':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-10 rounded-full bg-yellow-300/40 blur-lg"></div>
            </div>
            <Sun size={iconSize} color={iconColor} fill={iconColor} strokeWidth={2} className="relative z-10" />
          </div>
        );
      
      case 'water':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <Droplets size={iconSize} color={iconColor} fill={iconColor} strokeWidth={2.5} className="relative z-10" />
          </div>
        );
      
      case 'hide':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <Mountain size={iconSize} color={iconColor} fill={iconColor} strokeWidth={2} className="relative z-10" />
          </div>
        );
      
      case 'substrate':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <Warehouse size={iconSize} color={iconColor} strokeWidth={2} className="relative z-10" />
          </div>
        );
      
      case 'decor': {
        const plantVariant = item.variant || 'bush';
        let Icon = TreeDeciduous;
        
        if (plantVariant === 'fern') Icon = Leaf;
        else if (plantVariant === 'vine') Icon = Sprout;
        else if (plantVariant === 'tree') Icon = Trees;
        else if (plantVariant === 'grass') Icon = Sprout;
        else Icon = TreeDeciduous; // bush
        
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <Icon size={iconSize} color={iconColor} fill={iconColor} strokeWidth={2} className="relative z-10" />
          </div>
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
      className={`absolute p-0 text-xs font-medium text-center flex items-center justify-center group hover:z-50 transition-all ${
        isSelected 
          ? 'ring-4 ring-green-500 shadow-xl shadow-green-400/70 scale-105' 
          : 'ring-2 ring-white/60 shadow-lg'
      }`}
      data-equipment-id={item.id}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      title={item.type === 'decor' ? 'Click to change plant style' : 'Click to select'}
    >
      {/* Enhanced shadow for depth - multiple layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30 rounded pointer-events-none"></div>
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4/5 h-2 bg-black/20 blur-sm rounded-full pointer-events-none"></div>
      <div
        {...listeners}
        {...attributes}
        className="cursor-move w-full h-full flex items-center justify-center relative bg-gradient-to-br from-white/10 to-transparent rounded"
      >
        {renderShape()}
      </div>

      {/* Resize handle (bottom-right corner) */}
      {isSelected && (
        <button
          onMouseDown={handleResizeStart}
          className="absolute -bottom-2 -right-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 z-50 cursor-nwse-resize"
          title="Resize (drag to scale)"
        >
          ⇲
        </button>
      )}

      {/* Rotation handle (top-right corner) */}
      {isSelected && (
        <>
          <button
            onMouseDown={handleRotateStart}
            className="absolute -top-2 -right-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 z-50 cursor-grab active:cursor-grabbing"
            title="Rotate (drag around item)"
          >
            ↻
          </button>
          {isRotating && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap z-50 shadow-lg">
              {Math.round(rotation)}°
            </div>
          )}
        </>
      )}

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
          className="absolute -top-2 -left-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold transition-all flex-shrink-0 z-50 shadow-md hover:shadow-lg hover:scale-110"
          title="Delete item (Click to remove)"
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
      className="relative border-[12px] border-gray-800 rounded-lg overflow-hidden shadow-2xl"
      style={{ 
        width: '100%', 
        paddingBottom: '75%',
        background: 'linear-gradient(135deg, #2c1810 0%, #3d2817 50%, #2c1810 100%)',
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5), inset -4px -4px 12px rgba(0,0,0,0.4), inset 4px 4px 12px rgba(255,255,255,0.1), 0 20px 40px rgba(0,0,0,0.4)'
      }}
    >
      {/* Background wall with texture */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'linear-gradient(180deg, #3a2f28 0%, #4a3f35 50%, #3a2f28 100%)',
          backgroundImage: `
            repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.03) 40px, rgba(0,0,0,0.03) 80px),
            repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(0,0,0,0.03) 40px, rgba(0,0,0,0.03) 80px)
          `
        }}
      ></div>

      {/* Corner shadows for depth */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)'
      }}></div>
      
      {/* Glass reflection effect - multiple layers */}
      <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/30 via-white/10 to-transparent pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-1/4 h-full bg-gradient-to-l from-white/15 to-transparent pointer-events-none"></div>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.08) 40%, transparent 50%, rgba(255,255,255,0.05) 80%, transparent 100%)'
      }}></div>
      
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
  const [snapToGridEnabled, setSnapToGridEnabled] = useState(true);
  // const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  // const [isViewerReady, setIsViewerReady] = useState(false);
  // const addModelFnRef = useRef<((url: string, name?: string, proceduralGenerator?: () => THREE.Object3D) => void) | null>(null);

  // const handleAddModelReady = (addModelFn: (url: string, name?: string, proceduralGenerator?: () => THREE.Object3D) => void) => {
  //   addModelFnRef.current = addModelFn;
  //   setIsViewerReady(true);
  // };

  // const loadShoppingListIn3D = () => {
  //   if (!isViewerReady || !addModelFnRef.current) {
  //     alert('3D viewer is initializing... Please wait a moment and try again.');
  //     return;
  //   }

  //   let loadedCount = 0;
  //   
  //   shoppingList.forEach((item) => {
  //     const modelDef = matchItemToModel(item.name);
  //     
  //     if (modelDef) {
  //       if (modelDef.type === 'glb' && modelDef.url) {
  //         addModelFnRef.current!(modelDef.url, item.name, undefined);
  //         loadedCount++;
  //       } else if (modelDef.type === 'procedural' && modelDef.generator) {
  //         addModelFnRef.current!('', item.name, modelDef.generator);
  //         loadedCount++;
  //       }
  //     }
  //   });

  //   if (loadedCount === 0) {
  //     alert('No 3D models found for shopping list items. We\'re working on adding more models!');
  //   } else {
  //     setViewMode('3d');
  //   }
  // };

  const loadShoppingListIn2D = () => {
    const enclosureWidth = 800;
    const enclosureHeight = 600;
    const newItems: EquipmentItem[] = [];
    
    // Clear existing equipment first
    setEquipment([]);
    
    // Categorize items
    const heatItems: EquipmentItem[] = [];
    const uvbItems: EquipmentItem[] = [];
    const waterItems: EquipmentItem[] = [];
    const hideItems: EquipmentItem[] = [];
    const decorItems: EquipmentItem[] = [];
    const substrateItems: EquipmentItem[] = [];

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
      } else if (item.name.toLowerCase().includes('substrate') || item.name.toLowerCase().includes('soil') || item.name.toLowerCase().includes('bedding')) {
        type = 'substrate';
      }

      const equipItem: EquipmentItem = {
        id: `equipment-${Date.now()}-${idx}`,
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
      else if (type === 'substrate') substrateItems.push(equipItem);
      else decorItems.push(equipItem);
    });

    // Smart placement - FRONT VIEW (top to bottom, left to right)
    // UVB items: top-center (near ceiling for light coverage)
    uvbItems.forEach((item, idx) => {
      item.x = snapToGrid(enclosureWidth / 2 - item.width / 2);
      item.y = snapToGrid(20 + idx * 70);
      newItems.push(item);
    });

    // Heat items: top-left (warm side, elevated)
    heatItems.forEach((item, idx) => {
      item.x = snapToGrid(40 + (idx % 2) * 100);
      item.y = snapToGrid(80 + Math.floor(idx / 2) * 80);
      newItems.push(item);
    });

    // Hides: mid-level on both sides
    hideItems.forEach((item, idx) => {
      if (idx % 2 === 0) {
        // Left side hide (warm)
        item.x = snapToGrid(40);
        item.y = snapToGrid(enclosureHeight / 2 - 50 + Math.floor(idx / 2) * 80);
      } else {
        // Right side hide (cool)
        item.x = snapToGrid(enclosureWidth - 140);
        item.y = snapToGrid(enclosureHeight / 2 - 50 + Math.floor(idx / 2) * 80);
      }
      newItems.push(item);
    });

    // Decor: scattered throughout middle areas
    decorItems.forEach((item, idx) => {
      item.x = snapToGrid(enclosureWidth / 2 - 50 + (idx % 3 - 1) * 120);
      item.y = snapToGrid(200 + Math.floor(idx / 3) * 100);
      newItems.push(item);
    });

    // Water items: bottom-right (cool side, on ground)
    waterItems.forEach((item, idx) => {
      item.x = snapToGrid(enclosureWidth - 140 - (idx % 2) * 120);
      item.y = snapToGrid(enclosureHeight - 140 - Math.floor(idx / 2) * 80);
      newItems.push(item);
    });

    // Substrate items: bottom (not visible in view, but tracked)
    substrateItems.forEach((item) => {
      item.x = snapToGrid(enclosureWidth / 2);
      item.y = snapToGrid(enclosureHeight - 60);
      newItems.push(item);
    });

    setEquipment(newItems);
    setTimeout(() => checkWarnings(), 100);
  };

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

  const handleResize = (id: string, scale: number) => {
    setEquipment((items) =>
      items.map((item) =>
        item.id === id ? { ...item, scale } : item
      )
    );
  };

  const handleRotate = (id: string, rotation: number) => {
    setEquipment((items) =>
      items.map((item) =>
        item.id === id ? { ...item, rotation } : item
      )
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    
    setEquipment((items) =>
      items.map((item) => {
        if (item.id === active.id) {
          // Apply delta and snap to grid if enabled
          let newX = Math.max(0, item.x + delta.x);
          let newY = Math.max(0, item.y + delta.y);
          
          if (snapToGridEnabled) {
            newX = snapToGrid(newX);
            newY = snapToGrid(newY);
          }
          
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
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Enclosure Canvas */}
          <div className="lg:col-span-3">
            {/* View Mode Tabs */}
            {/* <div className="mb-4 flex justify-between items-center">
              <div className="flex gap-2 border-b border-gray-300">
                <button
                  onClick={() => setViewMode('2d')}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    viewMode === '2d'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  2D Designer
                </button>
                <button
                  onClick={() => setViewMode('3d')}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    viewMode === '3d'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  3D Model
                </button>
                <button
                  onClick={loadShoppingListIn3D}
                  disabled={viewMode !== '3d' || !isViewerReady}
                  className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-md ${
                    viewMode === '3d' && isViewerReady
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 hover:shadow-lg cursor-pointer'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                  title={!isViewerReady ? 'Loading 3D viewer...' : 'Load shopping list items as 3D models'}
                >
                  <span>{isViewerReady ? '📦' : '⏳'}</span>
                  {isViewerReady ? 'Load Shopping List in 3D' : 'Loading 3D Viewer...'}
                </button>
              </div>
            </div> */}

            {/* 2D Designer View */}
            {/* {viewMode === '2d' && ( */}
            {/* <> */}
                <div className="mb-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Front Elevation View ({enclosureInput.width}" wide × {enclosureInput.height}" tall)
                    </h4>
                    <div className="text-xs text-gray-600 mt-1">
                      🔥 {equipment.filter(e => e.type === 'heat').length} Heat • 
                      ☀️ {equipment.filter(e => e.type === 'uvb').length} Light • 
                      💧 {equipment.filter(e => e.type === 'water').length} Water • 
                      🏠 {equipment.filter(e => e.type === 'hide').length} Hide • 
                      🌿 {equipment.filter(e => e.type === 'decor').length} Decor
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={loadShoppingListIn2D}
                      className="px-3 py-1 text-xs bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded shadow-md transition-all font-medium"
                      title="Load all shopping list items into designer"
                    >
                      📋 Load Shopping List
                    </button>
                    <button
                      onClick={() => setShowGrid(!showGrid)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${showGrid ? 'bg-gray-400 text-white' : 'bg-gray-200 text-gray-700'}`}
                      title="Toggle grid overlay"
                    >
                      {showGrid ? '▦' : '▢'} Grid
                    </button>
                    <button
                      onClick={() => setSnapToGridEnabled(!snapToGridEnabled)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${snapToGridEnabled ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                      title="Toggle snap-to-grid positioning"
                    >
                      🧲 Snap
                    </button>
                    <button
                      onClick={() => setShowSafeZones(!showSafeZones)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${showSafeZones ? 'bg-purple-400 text-white' : 'bg-gray-200 text-gray-700'}`}
                      title="Toggle thermal and safety zones"
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
                      width: '280px',
                      height: '280px',
                      background: 'radial-gradient(circle, rgba(255,140,60,0.6) 0%, rgba(255,100,50,0.35) 30%, rgba(255,80,40,0.15) 60%, transparent 80%)',
                      transform: 'translate(-50%, -50%)',
                      filter: 'blur(40px)',
                      mixBlendMode: 'screen',
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
                      width: `${uvb.width * 1.8}px`,
                      height: '300px',
                      background: 'linear-gradient(180deg, rgba(255,250,220,0.4) 0%, rgba(255,250,200,0.25) 30%, rgba(255,250,180,0.1) 65%, transparent 100%)',
                      transform: 'translateX(-50%)',
                      pointerEvents: 'none',
                      filter: 'blur(25px)',
                      mixBlendMode: 'screen',
                    }}
                  ></div>
                ))}
              {showSafeZones && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Basking zone - top left (warm side, high up for UVB) */}
                  <div className="absolute left-0 top-0 w-1/2 h-1/3 border-3 border-dashed border-red-500 opacity-40 rounded-tl-lg"></div>
                  <div className="absolute left-3 top-3 text-xs font-bold text-red-700 bg-red-100/90 px-2 py-1 rounded shadow">
                    🔆 Basking (Top-Left)
                  </div>
                  
                  {/* Climbing/Activity zone - center */}
                  <div className="absolute left-1/4 top-1/4 w-1/2 h-1/2 border-2 border-dashed border-green-400 opacity-25 rounded-lg"></div>
                  
                  {/* Cooling zone - bottom right (ground level, cool side) */}
                  <div className="absolute right-0 bottom-0 w-1/2 h-1/3 border-3 border-dashed border-blue-500 opacity-40 rounded-br-lg"></div>
                  <div className="absolute right-3 bottom-3 text-xs font-bold text-blue-700 bg-blue-100/90 px-2 py-1 rounded shadow">
                    ❄️ Cool Zone (Bottom-Right)
                  </div>
                </div>
              )}

              {/* Temperature gradient zones with more realistic overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-gradient-to-r from-orange-400/15 to-orange-400/5"></div>
                <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-cyan-400/15 to-cyan-400/5"></div>
              </div>
              
              {/* Realistic substrate base layer */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
                style={{
                  background: 'linear-gradient(180deg, transparent 0%, rgba(90,60,30,0.3) 20%, rgba(80,55,30,0.6) 50%, #5a3a1e 100%)',
                  borderTop: '3px solid rgba(70,45,20,0.8)',
                  boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.4), inset 0 -5px 10px rgba(0,0,0,0.3)'
                }}
              >
                {/* Substrate texture overlay */}
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at 20% 30%, rgba(100,70,40,0.4) 1px, transparent 1px),
                      radial-gradient(circle at 60% 70%, rgba(90,60,35,0.3) 1.5px, transparent 1.5px),
                      radial-gradient(circle at 85% 15%, rgba(110,75,45,0.35) 1px, transparent 1px),
                      radial-gradient(circle at 35% 85%, rgba(95,65,40,0.3) 1.2px, transparent 1.2px),
                      repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(60,40,20,0.15) 2px, rgba(60,40,20,0.15) 3px)
                    `,
                    backgroundSize: '40px 40px, 60px 60px, 50px 50px, 45px 45px, 8px 8px',
                    backgroundPosition: '0 0, 20px 20px, 10px 30px, 35px 5px, 0 0'
                  }}
                ></div>
                
                {/* Substrate depth shadows */}
                <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/40 to-transparent"></div>
                
                <div className="absolute bottom-2 left-2 text-xs font-bold text-amber-100 bg-amber-900/80 px-2 py-1 rounded shadow-lg backdrop-blur-sm">
                  🪨 Substrate Layer
                </div>
              </div>
              
              {/* Height indicator - shows vertical scale */}
              <div className="absolute left-2 top-2 text-xs font-semibold text-gray-700 bg-white/90 px-2 py-1 rounded shadow-sm">
                ⬆️ Top of Enclosure
              </div>
              
              <div className="absolute top-2 left-2 text-xs font-semibold text-red-700 bg-white/90 px-2 py-1 rounded shadow-sm" style={{ marginTop: '30px' }}>
                🔥 Warm Side
              </div>
              <div className="absolute top-2 right-2 text-xs font-semibold text-blue-700 bg-white/90 px-2 py-1 rounded shadow-sm" style={{ marginTop: '30px' }}>
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
                  onResize={handleResize}
                  onRotate={handleRotate}
                />
              ))}
            </DroppableEnclosure>
            {/* </> */}
            {/* )} */}

            {/* 3D Model View */}
            {/* {viewMode === '3d' && (
              <ModelViewer3D 
                onAddModelReady={handleAddModelReady} 
                enclosureDimensions={{
                  width: enclosureInput.width,
                  depth: enclosureInput.depth,
                  height: enclosureInput.height
                }}
              />
            )} */}
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
                  onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
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
