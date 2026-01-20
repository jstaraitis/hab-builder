import { Layer, Rect, Line, Text } from 'react-konva';

export interface EquipmentItem {
  id: string;
  name: string;
  type: 'heat' | 'uvb' | 'water' | 'hide' | 'decor' | 'substrate';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  variant?: string;
  color?: string;
}

interface CanvasBackgroundLayerProps {
  width: number;
  height: number;
  showZones: boolean;
  showGrid: boolean;
}

export function CanvasBackgroundLayer({ width, height, showZones, showGrid }: CanvasBackgroundLayerProps) {
  // Grid lines
  const gridLines: JSX.Element[] = [];
  const gridSize = 20;
  
  if (showGrid) {
    // Vertical lines
    for (let i = 0; i <= width / gridSize; i++) {
      gridLines.push(
        <Line
          key={`v-${i}`}
          points={[i * gridSize, 0, i * gridSize, height]}
          stroke="#e0e0e0"
          strokeWidth={1}
          opacity={0.3}
        />
      );
    }
    // Horizontal lines
    for (let i = 0; i <= height / gridSize; i++) {
      gridLines.push(
        <Line
          key={`h-${i}`}
          points={[0, i * gridSize, width, i * gridSize]}
          stroke="#e0e0e0"
          strokeWidth={1}
          opacity={0.3}
        />
      );
    }
  }

  return (
    <Layer>
      {/* Main canvas background */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="#f9fafb"
        stroke="#d1d5db"
        strokeWidth={2}
      />

      {/* Grid */}
      {gridLines}

      {/* Temperature gradient zones */}
      <Rect
        x={0}
        y={0}
        width={width / 2}
        height={height}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: width / 2, y: 0 }}
        fillLinearGradientColorStops={[0, 'rgba(251, 146, 60, 0.15)', 1, 'rgba(251, 146, 60, 0.05)']}
      />
      <Rect
        x={width / 2}
        y={0}
        width={width / 2}
        height={height}
        fillLinearGradientStartPoint={{ x: width / 2, y: 0 }}
        fillLinearGradientEndPoint={{ x: width, y: 0 }}
        fillLinearGradientColorStops={[0, 'rgba(6, 182, 212, 0.05)', 1, 'rgba(6, 182, 212, 0.15)']}
      />

      {/* Substrate layer at bottom */}
      <Rect
        x={0}
        y={height - 80}
        width={width}
        height={80}
        fill="#8b7355"
        opacity={0.6}
      />
      <Rect
        x={0}
        y={height - 80}
        width={width}
        height={10}
        fill="black"
        opacity={0.3}
      />

      {/* Zone labels */}
      {showZones && (
        <>
          <Text
            x={20}
            y={20}
            text="🔥 Warm Side"
            fontSize={14}
            fontStyle="bold"
            fill="#dc2626"
            shadowColor="white"
            shadowBlur={4}
            shadowOffset={{ x: 0, y: 0 }}
            shadowOpacity={1}
          />
          <Text
            x={width - 120}
            y={20}
            text="❄️ Cool Side"
            fontSize={14}
            fontStyle="bold"
            fill="#0284c7"
            shadowColor="white"
            shadowBlur={4}
            shadowOffset={{ x: 0, y: 0 }}
            shadowOpacity={1}
          />
          <Text
            x={20}
            y={height - 60}
            text="🪨 Substrate Layer"
            fontSize={12}
            fill="#f59e0b"
            fontStyle="bold"
            shadowColor="black"
            shadowBlur={2}
            shadowOffset={{ x: 0, y: 0 }}
            shadowOpacity={0.5}
          />
        </>
      )}
    </Layer>
  );
}
