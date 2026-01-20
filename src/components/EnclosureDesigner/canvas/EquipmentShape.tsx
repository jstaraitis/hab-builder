import { Group, Rect, Circle, Star, RegularPolygon, Text, Image as KonvaImage } from 'react-konva';
import { useEffect, useRef, useState } from 'react';
import type { EquipmentItem } from './CanvasBackgroundLayer';

interface EquipmentShapeProps {
  item: EquipmentItem;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (e: any) => void;
}

export function EquipmentShape({ item, isSelected, onSelect, onDragEnd }: EquipmentShapeProps) {
  const shapeRef = useRef<any>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // Load image if it's a tree
  useEffect(() => {
    if (item.type === 'decor' && item.variant === 'tree') {
      const img = new window.Image();
      img.src = '/equipment/plants/tree.png';
      img.onload = () => setImage(img);
      img.onerror = () => setImage(null);
    }
  }, [item.type, item.variant]);

  const renderShape = () => {
    const baseProps = {
      onClick: onSelect,
      onTap: onSelect,
      fill: item.color || getDefaultColor(item.type),
      shadowColor: 'black',
      shadowBlur: 5,
      shadowOpacity: 0.3,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
    };

    // If tree with loaded image, render it
    if (item.type === 'decor' && item.variant === 'tree' && image) {
      return (
        <KonvaImage
          image={image}
          width={item.width}
          height={item.height}
          offsetX={item.width / 2}
          offsetY={item.height / 2}
          {...baseProps}
        />
      );
    }

    switch (item.type) {
      case 'heat':
        // Heat lamp with bulb appearance
        return (
          <>
            {/* Bulb base */}
            <Circle
              radius={item.width / 2}
              fill="rgba(255, 140, 60, 0.9)"
              shadowColor="rgba(255, 80, 0, 0.8)"
              shadowBlur={15}
              shadowOpacity={0.8}
              {...baseProps}
            />
            {/* Inner glow */}
            <Circle
              radius={item.width / 3}
              fill="rgba(255, 200, 100, 0.9)"
              shadowColor="yellow"
              shadowBlur={10}
            />
            {/* Filament */}
            <Star
              numPoints={8}
              innerRadius={item.width / 5}
              outerRadius={item.width / 3.5}
              fill="#ffeb3b"
              opacity={0.95}
            />
          </>
        );
      
      case 'uvb':
        // Linear fluorescent tube
        return (
          <>
            {/* Tube body with gradient effect */}
            <Rect
              width={item.width}
              height={item.height}
              offsetX={item.width / 2}
              offsetY={item.height / 2}
              cornerRadius={item.height / 2}
              fill="rgba(255, 230, 150, 0.9)"
              strokeWidth={2}
              stroke="rgba(200, 200, 200, 0.8)"
              shadowColor="rgba(255, 220, 100, 0.6)"
              shadowBlur={12}
              {...baseProps}
            />
            {/* Light highlights */}
            <Rect
              width={item.width - 10}
              height={item.height / 2}
              offsetX={(item.width - 10) / 2}
              y={-item.height / 4}
              cornerRadius={item.height / 4}
              fill="rgba(255, 255, 255, 0.4)"
            />
            {/* End caps */}
            <Circle
              x={-item.width / 2}
              radius={item.height / 2}
              fill="rgba(150, 150, 150, 0.8)"
            />
            <Circle
              x={item.width / 2}
              radius={item.height / 2}
              fill="rgba(150, 150, 150, 0.8)"
            />
          </>
        );
      
      case 'water':
        // Water dish with water surface
        return (
          <>
            {/* Dish rim */}
            <Circle
              radius={item.width / 2}
              fill="rgba(100, 100, 100, 0.8)"
              strokeWidth={2}
              stroke="rgba(70, 70, 70, 0.9)"
              {...baseProps}
            />
            {/* Water surface */}
            <Circle
              radius={item.width / 2.3}
              fill="rgba(100, 180, 255, 0.7)"
              shadowColor="rgba(50, 150, 255, 0.5)"
              shadowBlur={8}
            />
            {/* Water highlight/reflection */}
            <Circle
              x={-item.width / 8}
              y={-item.height / 6}
              radius={item.width / 5}
              fill="rgba(200, 230, 255, 0.6)"
            />
          </>
        );
      
      case 'hide':
        // Cork bark hide with texture
        return (
          <>
            {/* Main hide body */}
            <RegularPolygon
              sides={5}
              radius={item.width / 2}
              fill="rgba(139, 115, 85, 0.9)"
              strokeWidth={2}
              stroke="rgba(100, 80, 60, 0.9)"
              {...baseProps}
            />
            {/* Cork texture lines */}
            <RegularPolygon
              sides={5}
              radius={item.width / 2.5}
              fill="rgba(120, 95, 70, 0.5)"
            />
            {/* Shadow/depth */}
            <RegularPolygon
              sides={5}
              radius={item.width / 3.5}
              fill="rgba(80, 60, 45, 0.4)"
            />
          </>
        );
      
      case 'substrate':
        // Substrate layer with soil texture
        return (
          <>
            <Rect
              width={item.width}
              height={item.height}
              offsetX={item.width / 2}
              offsetY={item.height / 2}
              cornerRadius={5}
              fill="rgba(139, 100, 65, 0.85)"
              strokeWidth={1}
              stroke="rgba(100, 70, 45, 0.9)"
              {...baseProps}
            />
            {/* Soil texture overlay */}
            <Rect
              width={item.width - 8}
              height={item.height - 8}
              offsetX={(item.width - 8) / 2}
              offsetY={(item.height - 8) / 2}
              cornerRadius={4}
              fill="rgba(120, 85, 50, 0.3)"
            />
          </>
        );
      
      case 'decor':
      default:
        // Different shapes for plant variants
        if (item.variant === 'fern') {
          // Fern with leafy appearance
          return (
            <>
              <Circle
                radius={item.width / 2}
                fill="rgba(40, 150, 80, 0.85)"
                {...baseProps}
              />
              <Star
                numPoints={12}
                innerRadius={item.width / 3.5}
                outerRadius={item.width / 2}
                fill="rgba(80, 200, 120, 0.8)"
              />
              {/* Inner detail */}
              <Circle
                radius={item.width / 4}
                fill="rgba(100, 220, 140, 0.6)"
              />
            </>
          );
        } else if (item.variant === 'vine') {
          // Vine with textured appearance
          return (
            <>
              <RegularPolygon
                sides={6}
                radius={item.width / 2}
                fill="rgba(50, 140, 70, 0.85)"
                {...baseProps}
              />
              <RegularPolygon
                sides={6}
                radius={item.width / 3}
                fill="rgba(70, 180, 90, 0.7)"
              />
            </>
          );
        } else if (item.variant === 'grass') {
          // Ground cover grass
          return (
            <>
              <Rect
                width={item.width}
                height={item.height}
                offsetX={item.width / 2}
                offsetY={item.height / 2}
                fill="rgba(100, 180, 50, 0.85)"
                {...baseProps}
              />
              {/* Grass texture */}
              <Rect
                width={item.width - 8}
                height={item.height / 2}
                offsetX={(item.width - 8) / 2}
                y={-item.height / 4}
                fill="rgba(130, 200, 70, 0.6)"
              />
            </>
          );
        } else {
          // Bush with fuller appearance
          return (
            <>
              <Circle
                radius={item.width / 2}
                fill="rgba(50, 160, 80, 0.85)"
                {...baseProps}
              />
              {/* Foliage clusters */}
              <Circle
                x={-item.width / 6}
                y={-item.height / 6}
                radius={item.width / 3}
                fill="rgba(70, 180, 100, 0.7)"
              />
              <Circle
                x={item.width / 6}
                y={-item.height / 8}
                radius={item.width / 3.5}
                fill="rgba(80, 190, 110, 0.7)"
              />
            </>
          );
        }
    }
  };

  return (
    <Group
      id={item.id}
      ref={shapeRef}
      x={item.x}
      y={item.y}
      rotation={item.rotation}
      scaleX={item.scale}
      scaleY={item.scale}
      width={item.width}
      height={item.height}
      draggable
      onDragEnd={onDragEnd}
      onClick={onSelect}
      onTap={onSelect}
    >
      {renderShape()}
      
      {/* Selection indicator */}
      {isSelected && (
        <Circle
          radius={item.width / 2 + 5}
          stroke="#10b981"
          strokeWidth={3}
          dash={[5, 5]}
        />
      )}
      
      {/* Label */}
      <Text
        y={item.height / 2 + 10}
        text={item.name}
        fontSize={10}
        fill="black"
        align="center"
        width={item.width}
        offsetX={item.width / 2}
        fontStyle="bold"
        shadowColor="white"
        shadowBlur={3}
        shadowOpacity={1}
      />
    </Group>
  );
}

function getDefaultColor(type: EquipmentItem['type']): string {
  switch (type) {
    case 'heat': return '#ff6b35';
    case 'uvb': return '#ffd700';
    case 'water': return '#4fc3f7';
    case 'hide': return '#8b7355';
    case 'substrate': return '#a67c52';
    case 'decor': return '#22c55e';
    default: return '#666';
  }
}
