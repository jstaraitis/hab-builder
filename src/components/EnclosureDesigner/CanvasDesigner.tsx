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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [showGrid, setShowGrid] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [history, setHistory] = useState<EquipmentItem[][]>([]);
  const [historyStep, setHistoryStep] = useState(0);

  // Canvas dimensions
  const canvasWidth = 800;
  const canvasHeight = 600;

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
    const newEquipment = equipment.map(item =>
      item.id === id ? { ...item, x: node.x(), y: node.y() } : item
    );
    setEquipment(newEquipment);
    addToHistory(newEquipment);
  }, [equipment]);

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

  // Delete selected item
  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    const newEquipment = equipment.filter(item => item.id !== selectedId);
    setEquipment(newEquipment);
    addToHistory(newEquipment);
    setSelectedId(null);
  }, [selectedId, equipment]);

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

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <button
            onClick={undo}
            disabled={historyStep === 0}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded text-sm font-medium transition-colors"
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button
            onClick={redo}
            disabled={historyStep === history.length - 1}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded text-sm font-medium transition-colors"
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>
          <button
            onClick={handleDelete}
            disabled={!selectedId}
            className="px-3 py-2 bg-red-100 hover:bg-red-200 disabled:bg-gray-50 disabled:text-gray-400 text-red-700 rounded text-sm font-medium transition-colors"
            title="Delete (Delete key)"
          >
            🗑️ Delete
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              showGrid ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {showGrid ? '☑' : '☐'} Grid
          </button>
          <button
            onClick={() => setShowZones(!showZones)}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              showZones ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {showZones ? '☑' : '☐'} Zones
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
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

      {/* Main Layout: Canvas + Equipment Library */}
      <div className="grid lg:grid-cols-4 gap-4">
        {/* Canvas */}
        <div className="lg:col-span-3">
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
                  />
                ))}
                <Transformer
                  ref={transformerRef}
                  onTransformEnd={handleTransformEnd}
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
  const items: EquipmentItem[] = [];
  let yOffset = 100;
  let xOffset = 100;

  shoppingList.forEach((item, idx) => {
    let type: EquipmentItem['type'] = 'decor';
    
    const name = item.name.toLowerCase();
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
