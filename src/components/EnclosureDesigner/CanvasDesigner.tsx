import { Stage, Layer, Transformer } from 'react-konva';
import { useRef, useState, useCallback, useEffect } from 'react';
import Konva from 'konva';
import type { ShoppingItem, EnclosureInput } from '../../engine/types';
import { CanvasBackgroundLayer, type EquipmentItem } from './canvas/CanvasBackgroundLayer';
import { EquipmentShape } from './canvas/EquipmentShape';
import EquipmentLibrary from './panels/EquipmentLibrary';

interface CanvasDesignerProps {
  enclosureInput: EnclosureInput;
  shoppingList: ShoppingItem[];
}

export default function CanvasDesigner({ enclosureInput, shoppingList }: CanvasDesignerProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [showGrid, setShowGrid] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [history, setHistory] = useState<EquipmentItem[][]>([]);
  const [historyStep, setHistoryStep] = useState(0);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });

  // Canvas dimensions
  const canvasWidth = canvasDimensions.width;
  const canvasHeight = canvasDimensions.height;

  // Update canvas dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = Math.min(width * 0.75, 800); // Maintain aspect ratio, max 800px height
        setCanvasDimensions({ width, height });
      }
    };

    updateDimensions();
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Initialize equipment from shopping list
  useEffect(() => {
    const items = generateEquipmentFromShoppingList(shoppingList, canvasWidth);
    setEquipment(items);
    setHistory([items]);
    setHistoryStep(0);
  }, [shoppingList]);

  // Handle selection
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  // Handle deselection
  const handleDeselect = useCallback((e: any) => {
    // Check if clicked on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback((id: string, e: any) => {
    const node = e.target;
    const draggedItem = equipment.find(item => item.id === id);
    
    // Constrain to canvas boundaries
    let newX = node.x();
    let newY = node.y();
    
    if (draggedItem) {
      const halfWidth = draggedItem.width / 2;
      const halfHeight = draggedItem.height / 2;
      
      // Keep within left/right bounds
      newX = Math.max(halfWidth, Math.min(canvasWidth - halfWidth, newX));
      // Keep within top/bottom bounds
      newY = Math.max(halfHeight, Math.min(canvasHeight - halfHeight, newY));
    }
    
    const newEquipment = equipment.map(item =>
      item.id === id ? { ...item, x: newX, y: newY } : item
    );
    setEquipment(newEquipment);
    addToHistory(newEquipment);
  }, [equipment, canvasWidth, canvasHeight]);

  // Handle transform end (rotate/resize)
  const handleTransformEnd = useCallback((e: any) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and apply it to width/height
    node.scaleX(1);
    node.scaleY(1);

    const newEquipment = equipment.map(item =>
      item.id === selectedId
        ? {
            ...item,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
            rotation: node.rotation(),
          }
        : item
    );
    setEquipment(newEquipment);
    addToHistory(newEquipment);
  }, [equipment, selectedId]);

  // Update transformer when selection changes
  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;

    if (selectedId) {
      const selectedNode = stage.findOne(`#${selectedId}`);
      if (selectedNode) {
        transformer.nodes([selectedNode]);
        transformer.getLayer()?.batchDraw();
      }
    } else {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedId]);

  // History management
  const addToHistory = (newState: EquipmentItem[]) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      setEquipment(history[historyStep - 1]);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      setEquipment(history[historyStep + 1]);
    }
  };

  // Export to PNG
  const handleExport = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const dataURL = stage.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `enclosure-design-${enclosureInput.animal}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [enclosureInput.animal]);

  // Rotate selected item
  const handleRotate = useCallback((degrees: number) => {
    if (!selectedId) return;
    const newEquipment = equipment.map(item =>
      item.id === selectedId
        ? { ...item, rotation: (item.rotation + degrees) % 360 }
        : item
    );
    setEquipment(newEquipment);
    addToHistory(newEquipment);
  }, [selectedId, equipment]);

  // Reset rotation
  const handleResetRotation = useCallback(() => {
    if (!selectedId) return;
    const newEquipment = equipment.map(item =>
      item.id === selectedId ? { ...item, rotation: 0 } : item
    );
    setEquipment(newEquipment);
    addToHistory(newEquipment);
  }, [selectedId, equipment]);

  // Scale selected item
  const handleScale = useCallback((factor: number) => {
    if (!selectedId) return;
    const newEquipment = equipment.map(item =>
      item.id === selectedId
        ? {
            ...item,
            width: Math.max(20, item.width * factor),
            height: Math.max(20, item.height * factor),
          }
        : item
    );
    setEquipment(newEquipment);
    addToHistory(newEquipment);
  }, [selectedId, equipment]);

  // Delete selected item
  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    const newEquipment = equipment.filter(item => item.id !== selectedId);
    setEquipment(newEquipment);
    addToHistory(newEquipment);
    setSelectedId(null);
  }, [selectedId, equipment]);

  // Remove all items
  const handleRemoveAll = useCallback(() => {
    if (equipment.length === 0) return;
    const newEquipment: EquipmentItem[] = [];
    setEquipment(newEquipment);
    addToHistory(newEquipment);
    setSelectedId(null);
  }, [equipment]);

  // Add new item from equipment library
  const handleAddItem = useCallback((type: string, variant?: string) => {
    const newItem: EquipmentItem = {
      id: `item-${Date.now()}`,
      name: getItemName(type, variant),
      type: type as EquipmentItem['type'],
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      width: getDefaultWidth(type),
      height: getDefaultHeight(type),
      rotation: 0,
      scale: 1,
      variant,
    };
    
    const newEquipment = [...equipment, newItem];
    setEquipment(newEquipment);
    addToHistory(newEquipment);
    setSelectedId(newItem.id);
  }, [equipment, canvasWidth, canvasHeight]);

  // Get selected item
  const selectedItem = equipment.find(item => item.id === selectedId);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          <button
            onClick={undo}
            disabled={historyStep === 0}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow"
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button
            onClick={redo}
            disabled={historyStep === history.length - 1}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow"
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>
          <button
            onClick={handleDelete}
            disabled={!selectedId}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow"
            title="Delete (Delete key)"
          >
            🗑️ Delete
          </button>
          <button
            onClick={handleRemoveAll}
            disabled={equipment.length === 0}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md"
            title="Remove all items from canvas"
          >
            🗑️ Remove All
          </button>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow ${
              showGrid 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {showGrid ? '☑' : '☐'} Grid
          </button>
          <button
            onClick={() => setShowZones(!showZones)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow ${
              showZones 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {showZones ? '☑' : '☐'} Zones
          </button>
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow ${
              showLabels 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {showLabels ? '☑' : '☐'} Labels
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md"
          >
            📸 Export PNG
          </button>
        </div>
      </div>

      {/* Canvas Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap justify-between items-center gap-2 text-sm">
            <p className="text-blue-900 dark:text-blue-200">
              <strong>Canvas:</strong> {enclosureInput.width}" × {enclosureInput.height}" • <strong>Items:</strong> {equipment.length}
            </p>
            <p className="text-blue-700 dark:text-blue-300 text-xs">
              💡 Click to select • Drag to move • Handles to rotate/resize
            </p>
          </div>
          {selectedId && (
            <div className="text-sm text-blue-900 dark:text-blue-200">
              <strong className="text-green-700 dark:text-green-400">Selected:</strong>{' '}
              <span className="break-all">{equipment.find(e => e.id === selectedId)?.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Selected Item Controls */}
      {selectedItem && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 shadow-md border-2 border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                Selected: <span className="text-purple-700 dark:text-purple-300">{selectedItem.name}</span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Size: {Math.round(selectedItem.width)}×{Math.round(selectedItem.height)} |
                Rotation: {Math.round(selectedItem.rotation)}°
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {/* Rotation Controls */}
              <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg px-2 py-1 shadow-sm">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mr-1">Rotate:</span>
                <button
                  onClick={() => handleRotate(-15)}
                  className="px-3 py-1 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded text-sm font-semibold transition-all"
                  title="Rotate 15° counter-clockwise"
                >
                  ↶ 15°
                </button>
                <button
                  onClick={() => handleRotate(15)}
                  className="px-3 py-1 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded text-sm font-semibold transition-all"
                  title="Rotate 15° clockwise"
                >
                  ↷ 15°
                </button>
                <button
                  onClick={handleResetRotation}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm font-semibold transition-all"
                  title="Reset rotation to 0°"
                >
                  ⟲ Reset
                </button>
              </div>

              {/* Size Controls */}
              <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg px-2 py-1 shadow-sm">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mr-1">Size:</span>
                <button
                  onClick={() => handleScale(0.9)}
                  className="px-3 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded text-sm font-semibold transition-all"
                  title="Decrease size by 10%"
                >
                  − 10%
                </button>
                <button
                  onClick={() => handleScale(1.1)}
                  className="px-3 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded text-sm font-semibold transition-all"
                  title="Increase size by 10%"
                >
                  + 10%
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout: Canvas + Equipment Library */}
      <div className="grid lg:grid-cols-4 gap-4">
        {/* Canvas */}
        <div className="lg:col-span-3" ref={containerRef}>
          <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-lg">
            <Stage
              ref={stageRef}
              width={canvasWidth}
              height={canvasHeight}
              onMouseDown={handleDeselect}
              onTouchStart={handleDeselect}
            >
              {/* Background layer */}
              <CanvasBackgroundLayer
                width={canvasWidth}
                height={canvasHeight}
                showGrid={showGrid}
                showZones={showZones}
              />

              {/* Equipment layer */}
              <Layer>
                {equipment.map((item) => (
                  <EquipmentShape
                    key={item.id}
                    item={item}
                    isSelected={item.id === selectedId}
                    onSelect={() => handleSelect(item.id)}
                    onDragEnd={(e) => handleDragEnd(item.id, e)}
                    showLabel={showLabels}
                  />
                ))}
                <Transformer
                  ref={transformerRef}
                  onTransformEnd={handleTransformEnd}
                  rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                  rotationSnapTolerance={5}
                  enabledAnchors={[
                    'top-left',
                    'top-right',
                    'bottom-left',
                    'bottom-right',
                    'middle-left',
                    'middle-right',
                    'top-center',
                    'bottom-center',
                  ]}
                  keepRatio={false}
                  borderStroke="#6366f1"
                  borderStrokeWidth={2}
                  anchorFill="#818cf8"
                  anchorStroke="#4f46e5"
                  anchorSize={10}
                  anchorCornerRadius={2}
                  boundBoxFunc={(oldBox, newBox) => {
                    // Limit resize
                    if (newBox.width < 20 || newBox.height < 20) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                />
              </Layer>
            </Stage>
          </div>
        </div>

        {/* Equipment Library Sidebar */}
        <div className="lg:col-span-1">
          <EquipmentLibrary onAddItem={handleAddItem} />
        </div>
      </div>
    </div>
  );
}

// Helper function to generate equipment from shopping list
function generateEquipmentFromShoppingList(
  shoppingList: ShoppingItem[],
  canvasWidth: number
): EquipmentItem[] {
  // Items to exclude from the canvas designer
  const excludedItems = [
    'enclosure',
    'terrarium',
    'spray bottle',
    'mister',
    'water dechlorinator',
    'dechlorinator',
    'feeder insects',
    'insects',
    'crickets',
    'dubia',
    'mealworms',
    'supplement',
    'calcium',
    'vitamin',
    'tongs',
    'feeding tongs',
  ];

  const items: EquipmentItem[] = [];
  let yOffset = 100;
  let xOffset = 100;

  shoppingList.forEach((item, idx) => {
    const name = item.name.toLowerCase();
    
    // Skip excluded items
    const shouldExclude = excludedItems.some(excluded => name.includes(excluded));
    if (shouldExclude) {
      return; // Skip this item
    }

    let type: EquipmentItem['type'] = 'decor';
    
    if (name.includes('heat') || name.includes('lamp') || name.includes('basking')) {
      type = 'heat';
    } else if (name.includes('uvb') || name.includes('light') || name.includes('fixture')) {
      type = 'uvb';
    } else if (name.includes('water') || name.includes('dish') || name.includes('bowl')) {
      type = 'water';
    } else if (name.includes('hide') || name.includes('cave') || name.includes('shelter')) {
      type = 'hide';
    } else if (name.includes('substrate') || name.includes('soil') || name.includes('bedding')) {
      type = 'substrate';
    }

    const equipItem: EquipmentItem = {
      id: `item-${idx}`,
      name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
      type,
      x: xOffset,
      y: yOffset,
      width: type === 'uvb' ? 140 : type === 'substrate' ? 100 : type === 'water' ? 60 : 70,
      height: type === 'substrate' ? 50 : type === 'uvb' ? 30 : 70,
      rotation: 0,
      scale: 1,
    };

    items.push(equipItem);

    // Update position for next item
    xOffset += 120;
    if (xOffset > canvasWidth - 150) {
      xOffset = 100;
      yOffset += 100;
    }
  });

  return items;
}

// Helper functions for adding new items
function getItemName(type: string, variant?: string): string {
  if (variant) return variant.charAt(0).toUpperCase() + variant.slice(1);
  switch (type) {
    case 'heat': return 'Heat Lamp';
    case 'uvb': return 'UVB Light';
    case 'water': return 'Water Dish';
    case 'hide': return 'Hide';
    case 'substrate': return 'Substrate';
    case 'decor': return 'Plant';
    default: return 'Item';
  }
}

function getDefaultWidth(type: string): number {
  switch (type) {
    case 'uvb': return 140;
    case 'substrate': return 100;
    case 'water': return 60;
    default: return 70;
  }
}

function getDefaultHeight(type: string): number {
  switch (type) {
    case 'substrate': return 50;
    case 'uvb': return 30;
    default: return 70;
  }
}
