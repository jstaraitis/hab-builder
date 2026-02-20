import { Group, Rect, Circle, Star, RegularPolygon, Text, Image as KonvaImage } from 'react-konva';
import { useEffect, useRef, useState } from 'react';
import type { EquipmentItem } from './CanvasBackgroundLayer';

interface EquipmentShapeProps {
  item: EquipmentItem;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (e: any) => void;
  showLabel?: boolean;
}

export function EquipmentShape({ item, isSelected, onSelect, onDragEnd, showLabel = true }: EquipmentShapeProps) {
  const shapeRef = useRef<any>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // Load image for matching equipment variants from a flat image folder
  // Preferred location: public/equiptment/{variant}.png
  useEffect(() => {
    if (!item.variant) {
      setImage(null);
      return;
    }

    const variant = item.variant.toLowerCase();

    const candidatePaths = [
      `/equiptment/${variant}.png`,
      `/equipment/${variant}.png`,
      `/equipment/plants/${variant}.png`,
      `/equipment/decor/${variant}.png`,
    ].filter(Boolean);

    if (candidatePaths.length === 0) {
      setImage(null);
      return;
    }

    let isCancelled = false;
    let currentIndex = 0;

    const tryLoad = () => {
      if (currentIndex >= candidatePaths.length) {
        if (!isCancelled) {
          setImage(null);
        }
        return;
      }

      const img = new globalThis.Image();
      img.onload = () => {
        if (!isCancelled) {
          setImage(img);
        }
      };
      img.onerror = () => {
        currentIndex += 1;
        tryLoad();
      };
      img.src = candidatePaths[currentIndex];
    };

    tryLoad();

    return () => {
      isCancelled = true;
    };
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

    // If a variant image exists, render it
    if (item.variant && image) {
      return (
        <KonvaImage
          image={image}
          width={item.width}
          height={item.height}
          offsetX={item.width / 2}
          offsetY={item.height / 2}
          fillEnabled={false}
          {...baseProps}
        />
      );
    }

    // Render decorative items with specific variants
    if (item.type === 'decor' && item.variant) {
      return renderDecorVariant(item, baseProps);
    }

    switch (item.type) {
      case 'heat':
        // Heat lamp with bulb appearance
        return (
          <>
            {/* Bulb base */}
            <Circle
              radius={item.width / 2}
              {...baseProps}
              fill="rgba(255, 140, 60, 0.9)"
              shadowColor="rgba(255, 80, 0, 0.8)"
              shadowBlur={15}
              shadowOpacity={0.8}
            />
            {/* Inner glow */}
            <Circle
              radius={item.width / 3}
              {...baseProps}
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
              {...baseProps}
              fill="rgba(255, 230, 150, 0.9)"
              strokeWidth={2}
              stroke="rgba(200, 200, 200, 0.8)"
              shadowColor="rgba(255, 220, 100, 0.6)"
              shadowBlur={12}
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
        // Water dish with realistic water surface
        return (
          <>
            {/* Dish shadow */}
            <Circle
              radius={item.width / 2 + 2}
              fill="rgba(50, 50, 50, 0.3)"
              y={3}
            />
            {/* Ceramic dish with gradient */}
            <Circle
              radius={item.width / 2}
              {...baseProps}
              fill="#9E9E9E"
              strokeWidth={3}
              stroke="#616161"
            />
            {/* Inner dish depth */}
            <Circle
              radius={item.width / 2.2}
              fill="#757575"
            />
            {/* Water surface with blue gradient */}
            <Circle
              radius={item.width / 2.4}
              fill="#42A5F5"
              shadowColor="rgba(25, 118, 210, 0.5)"
              shadowBlur={10}
              opacity={0.85}
            />
            {/* Water depth variation */}
            <Circle
              radius={item.width / 3}
              fill="rgba(30, 136, 229, 0.6)"
            />
            {/* Water highlight/reflection - top left */}
            <Circle
              x={-item.width / 6}
              y={-item.height / 6}
              radius={item.width / 5}
              fill="rgba(227, 242, 253, 0.7)"
            />
            {/* Small sparkle */}
            <Circle
              x={item.width / 8}
              y={-item.height / 8}
              radius={item.width / 12}
              fill="rgba(255, 255, 255, 0.9)"
            />
          </>
        );
      
      case 'hide':
        // Cork bark hide with texture
        return (
          <>
            {/* Shadow base */}
            <RegularPolygon
              sides={5}
              radius={item.width / 2 + 3}
              fill="rgba(60, 50, 40, 0.4)"
              y={3}
            />
            {/* Main hide body with cork pattern */}
            <RegularPolygon
              sides={5}
              radius={item.width / 2}
              {...baseProps}
              fill="#A0826D"
              strokeWidth={3}
              stroke="#7A6451"
            />
            {/* Cork texture overlay */}
            <RegularPolygon
              sides={5}
              radius={item.width / 2.5}
              fill="rgba(120, 95, 70, 0.4)"
            />
            {/* Dark entrance/depth */}
            <RegularPolygon
              sides={5}
              radius={item.width / 3.5}
              fill="rgba(40, 30, 25, 0.7)"
            />
            {/* Highlight edge */}
            <RegularPolygon
              sides={5}
              radius={item.width / 2}
              fill="rgba(180, 160, 140, 0.2)"
              rotation={10}
            />
          </>
        );
      
      case 'substrate':
        // Substrate layer with soil texture
        return (
          <>
            {/* Shadow/depth */}
            <Rect
              width={item.width}
              height={item.height}
              offsetX={item.width / 2}
              offsetY={item.height / 2}
              cornerRadius={5}
              fill="rgba(60, 40, 25, 0.3)"
              y={2}
            />
            {/* Main substrate with soil pattern */}
            <Rect
              width={item.width}
              height={item.height}
              offsetX={item.width / 2}
              offsetY={item.height / 2}
              cornerRadius={5}
              {...baseProps}
              fill="#6B4423"
              strokeWidth={2}
              stroke="#4A2811"
            />
            {/* Texture overlay - darker variation */}
            <Rect
              width={item.width - 8}
              height={item.height - 8}
              offsetX={(item.width - 8) / 2}
              offsetY={(item.height - 8) / 2}
              cornerRadius={4}
              fill="rgba(90, 60, 35, 0.4)"
            />
            {/* Highlight on top */}
            <Rect
              width={item.width - 10}
              height={item.height / 4}
              offsetX={(item.width - 10) / 2}
              y={-item.height / 2 + 5}
              cornerRadius={3}
              fill="rgba(160, 120, 80, 0.3)"
            />
          </>
        );
      
      case 'decor':
      default:
        // Different shapes for plant variants
        if (item.variant === 'fern') {
          // Fern with multiple fronds
          return (
            <>
              {/* Pot shadow */}
              <Circle
                y={item.height / 4 + 2}
                radius={item.width / 4 + 1}
                fill="rgba(80, 60, 40, 0.4)"
              />
              {/* Terra cotta pot with gradient */}
              <Circle
                y={item.height / 4}
                radius={item.width / 4}
                fill="#B8734F"
                strokeWidth={2}
                stroke="#8B5A3C"
              />
              <Circle
                y={item.height / 4 - 5}
                radius={item.width / 5}
                fill="rgba(200, 140, 100, 0.5)"
              />
              {/* Back fronds (darker) */}
              {[0, 2, 4, 6].map((i) => {
                const angle = (i * Math.PI) / 4;
                const length = item.width / 2.5;
                return (
                  <Star
                    key={`back-${i}`}
                    x={Math.cos(angle) * length * 0.4}
                    y={Math.sin(angle) * length * 0.4}
                    numPoints={8}
                    innerRadius={length * 0.35}
                    outerRadius={length * 0.9}
                    fill="#2D5D3F"
                    rotation={angle * (180 / Math.PI)}
                    shadowColor="rgba(0, 80, 40, 0.5)"
                    shadowBlur={10}
                  />
                );
              })}
              {/* Front fronds (brighter) */}
              {[1, 3, 5, 7].map((i) => {
                const angle = (i * Math.PI) / 4;
                const length = item.width / 2.5;
                return (
                  <Star
                    key={`front-${i}`}
                    x={Math.cos(angle) * length * 0.5}
                    y={Math.sin(angle) * length * 0.5}
                    numPoints={8}
                    innerRadius={length * 0.4}
                    outerRadius={length}
                    fill="#4CAF50"
                    rotation={angle * (180 / Math.PI)}
                    shadowColor="rgba(0, 100, 50, 0.4)"
                    shadowBlur={8}
                  />
                );
              })}
              {/* Center bright cluster */}
              <Circle
                radius={item.width / 5}
                fill="#66BB6A"
                shadowColor="rgba(50, 150, 80, 0.5)"
                shadowBlur={6}
              />
              {/* Top highlight */}
              <Circle
                y={-5}
                radius={item.width / 8}
                fill="rgba(150, 255, 180, 0.6)"
              />
            </>
          );
        } else if (item.variant === 'vine') {
          // Trailing vine with leaves
          return (
            <>
              {/* Vine stem - curved path with wood-like texture */}
              {[0, 1, 2, 3, 4].map((i) => (
                <Circle
                  key={i}
                  x={(i - 2) * 12 + Math.sin(i) * 8}
                  y={(i - 2) * 8}
                  radius={6 - i * 0.5}
                  fill="#5D4E37"
                  stroke="#3E2F23"
                  strokeWidth={1}
                />
              ))}
              {/* Leaves along vine - varied greens */}
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const greenShades = ['#4CAF50', '#66BB6A', '#43A047', '#558B2F', '#689F38'];
                return (
                  <RegularPolygon
                    key={`leaf-${i}`}
                    sides={3}
                    x={(i - 2.5) * 13 + Math.cos(i) * 10}
                    y={(i - 2.5) * 9 + Math.sin(i * 1.5) * 5}
                    radius={12}
                    fill={greenShades[i % greenShades.length]}
                    rotation={i * 60 + 90}
                    shadowColor="rgba(40, 120, 60, 0.4)"
                    shadowBlur={4}
                    stroke="#2E7D32"
                    strokeWidth={0.5}
                  />
                );
              })}
            </>
          );
        } else if (item.variant === 'grass') {
          // Multiple grass blades
          return (
            <>
              {/* Soil base shadow */}
              <Rect
                width={item.width}
                height={item.height / 3}
                offsetX={item.width / 2}
                y={item.height / 6 + 2}
                cornerRadius={5}
                fill="rgba(80, 60, 40, 0.4)"
              />
              {/* Soil base with texture */}
              <Rect
                width={item.width}
                height={item.height / 3}
                offsetX={item.width / 2}
                y={item.height / 6}
                cornerRadius={5}
                fill="#6B4423"
                strokeWidth={2}
                stroke="#4A2811"
              />
              {/* Grass blades - varied colors */}
              {[...Array(12)].map((_, i) => {
                const xPos = -item.width / 2 + (i * item.width) / 11;
                const height = item.height / 2 + Math.random() * (item.height / 4);
                const sway = Math.sin(i) * 5;
                const grassColors = ['#7CB342', '#8BC34A', '#9CCC65', '#689F38'];
                return (
                  <Rect
                    key={i}
                    x={xPos}
                    y={-height / 2}
                    width={3}
                    height={height}
                    fill={grassColors[i % grassColors.length]}
                    cornerRadius={1.5}
                    rotation={sway}
                    shadowColor="rgba(60, 100, 40, 0.3)"
                    shadowBlur={2}
                  />
                );
              })}
              {/* Top highlights on some blades */}
              {[1, 3, 5, 7, 9].map((i) => {
                const xPos = -item.width / 2 + (i * item.width) / 11;
                const height = item.height / 2.5;
                return (
                  <Rect
                    key={`highlight-${i}`}
                    x={xPos}
                    y={-height}
                    width={2}
                    height={height / 3}
                    fill="rgba(200, 255, 150, 0.6)"
                    cornerRadius={1}
                  />
                );
              })}
            </>
          );
        } else if (item.variant === 'bush' || !item.variant) {
          // Layered bush with depth
          return (
            <>
              {/* Shadow/base layer */}
              <Circle
                y={5}
                radius={item.width / 2}
                fill="rgba(30, 100, 50, 0.3)"
                shadowBlur={8}
              />
              {/* Back layer - darker */}
              <Circle
                radius={item.width / 2}
                {...baseProps}
                fill="rgba(40, 140, 70, 0.9)"
                shadowColor="rgba(20, 80, 40, 0.5)"
                shadowBlur={10}
              />
              {/* Mid layer clusters */}
              {[0, 1, 2, 3, 4].map((i) => {
                const angle = (i * Math.PI * 2) / 5;
                const radius = item.width / 2.5;
                return (
                  <Circle
                    key={i}
                    x={Math.cos(angle) * radius * 0.6}
                    y={Math.sin(angle) * radius * 0.6}
                    radius={item.width / 3.5}
                    fill="rgba(60, 170, 85, 0.85)"
                    shadowColor="rgba(30, 100, 50, 0.4)"
                    shadowBlur={6}
                  />
                );
              })}
              {/* Top highlights */}
              {[0, 1, 2].map((i) => {
                const xPos = (i - 1) * (item.width / 5);
                const yPos = -item.height / 8 - i * 3;
                return (
                  <Circle
                    key={`top-${i}`}
                    x={xPos}
                    y={yPos}
                    radius={item.width / 5}
                    fill="rgba(90, 200, 110, 0.8)"
                    shadowColor="rgba(120, 230, 140, 0.6)"
                    shadowBlur={8}
                  />
                );
              })}
              {/* Light reflection on top */}
              <Circle
                x={-item.width / 8}
                y={-item.height / 6}
                radius={item.width / 6}
                fill="rgba(150, 250, 170, 0.4)"
              />
            </>
          );
        } else {
          // Default bush
          return (
            <>
              <Circle
                radius={item.width / 2}
                {...baseProps}
                fill="rgba(50, 160, 80, 0.85)"
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
      
      {/* Emoji overlay - display prominent emoji if available */}
      {(() => {
        // Extract emoji (first character if present)
        const firstChar = item.name.trim()[0];
        // Check if first character is emoji (non-ASCII range typically indicates emoji)
        const isEmoji = firstChar && firstChar.charCodeAt(0) > 127;
        
        if (isEmoji) {
          const size = Math.min(item.width * 0.5, item.height * 0.5, 36);
          return (
            <Text
              text={firstChar}
              fontSize={size}
              x={-size / 2}
              y={-size / 2}
              width={size}
              height={size}
              align="center"
              verticalAlign="middle"
            />
          );
        }
        return null;
      })()}
      
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
      {showLabel && (
        <Text
          y={item.height / 2 + 10}
          text={item.name}
          fontSize={10}
          fill="black"
          align="center"
          width={item.width + 40}
          offsetX={(item.width + 40) / 2}
          fontStyle="bold"
          shadowColor="white"
          shadowBlur={3}
          shadowOpacity={1}
          wrap="word"
          ellipsis={true}
        />
      )}
    </Group>
  );
}

// Helper function to render decorative item variants
function renderDecorVariant(item: EquipmentItem, baseProps: any) {
  const variant = item.variant;
  
  // Monitoring equipment
  if (variant === 'monitor' || variant === 'probe' || variant === 'timer' || variant === 'thermostat') {
    return (
      <>
        <Rect
          width={item.width}
          height={item.height}
          offsetX={item.width / 2}
          offsetY={item.height / 2}
          cornerRadius={5}
          {...baseProps}
          fill="rgba(60, 60, 70, 0.9)"
          strokeWidth={2}
          stroke="rgba(40, 40, 50, 0.9)"
        />
        <Rect
          width={item.width - 10}
          height={item.height - 10}
          offsetX={(item.width - 10) / 2}
          offsetY={(item.height - 10) / 2}
          cornerRadius={3}
          fill="rgba(180, 200, 220, 0.8)"
        />
        <Text
          y={-5}
          text={variant === 'monitor' ? '📊' : variant === 'probe' ? '🌡️' : variant === 'timer' ? '⏰' : '🎛️'}
          fontSize={20}
          offsetX={10}
          align="center"
        />
      </>
    );
  }

  // Climbing structures
  if (variant === 'cork-tube') {
    return (
      <>
        {/* Shadow */}
        <Rect
          width={item.width}
          height={item.height}
          offsetX={item.width / 2}
          offsetY={item.height / 2}
          cornerRadius={10}
          fill="rgba(60, 50, 40, 0.4)"
          y={3}
        />
        {/* Outer cork with pattern */}
        <Rect
          width={item.width}
          height={item.height}
          offsetX={item.width / 2}
          offsetY={item.height / 2}
          cornerRadius={10}
          {...baseProps}
          fill="#A0826D"
          strokeWidth={4}
          stroke="#7A6451"
        />
        {/* Inner hollow - darker */}
        <Rect
          width={item.width - 20}
          height={item.height - 20}
          offsetX={(item.width - 20) / 2}
          offsetY={(item.height - 20) / 2}
          cornerRadius={8}
          fill="rgba(40, 30, 25, 0.8)"
        />
        {/* Highlight edge */}
        <Rect
          width={item.width - 5}
          height={10}
          offsetX={(item.width - 5) / 2}
          y={-item.height / 2 + 5}
          cornerRadius={5}
          fill="rgba(180, 160, 140, 0.3)"
        />
      </>
    );
  }

  if (variant === 'cork-flat' || variant === 'driftwood') {
    const isWood = variant === 'driftwood';
    return (
      <>
        {/* Shadow */}
        <Rect
          width={item.width}
          height={item.height}
          offsetX={item.width / 2}
          offsetY={item.height / 2}
          cornerRadius={5}
          fill="rgba(60, 50, 40, 0.4)"
          y={3}
        />
        {/* Main surface with texture */}
        <Rect
          width={item.width}
          height={item.height}
          offsetX={item.width / 2}
          offsetY={item.height / 2}
          cornerRadius={5}
          {...baseProps}
          fill={isWood ? "#8B6F47" : "#A0826D"}
          strokeWidth={3}
          stroke={isWood ? "#6B4423" : "#7A6451"}
        />
        {/* Wood grain lines */}
        {[...Array(5)].map((_, i) => (
          <Rect
            key={i}
            width={item.width - 10}
            height={1.5}
            x={-item.width / 2 + 5}
            y={-item.height / 2 + 10 + i * (item.height / 6)}
            cornerRadius={1}
            fill={isWood ? "rgba(80, 50, 30, 0.5)" : "rgba(100, 75, 50, 0.4)"}
          />
        ))}
        {/* Highlight */}
        <Rect
          width={item.width - 10}
          height={8}
          offsetX={(item.width - 10) / 2}
          y={-item.height / 2 + 5}
          cornerRadius={3}
          fill="rgba(200, 180, 150, 0.3)"
        />
      </>
    );
  }

  if (variant === 'bamboo') {
    return (
      <>
        {[0, 1, 2].map((i) => (
          <Rect
            key={i}
            width={12}
            height={item.height}
            x={-18 + i * 18}
            offsetY={item.height / 2}
            cornerRadius={6}
            fill="rgba(200, 180, 100, 0.9)"
            strokeWidth={2}
            stroke="rgba(150, 130, 70, 0.9)"
            {...baseProps}
          />
        ))}
      </>
    );
  }

  if (variant === 'net' || variant === 'mesh') {
    return (
      <>
        <Rect
          width={item.width}
          height={item.height}
          offsetX={item.width / 2}
          offsetY={item.height / 2}
          {...baseProps}
          fill="rgba(100, 100, 100, 0.4)"
          strokeWidth={1}
          stroke="rgba(80, 80, 80, 0.8)"
        />
        {/* Grid pattern */}
        {[...Array(5)].map((_, i) => (
          <Group key={i}>
            <Rect width={item.width} height={1} y={-item.height / 2 + (i * item.height) / 4} fill="rgba(60, 60, 60, 0.6)" />
            <Rect width={1} height={item.height} x={-item.width / 2 + (i * item.width) / 4} y={-item.height / 2} fill="rgba(60, 60, 60, 0.6)" />
          </Group>
        ))}
      </>
    );
  }

  if (variant === 'hammock') {
    return (
      <>
        <Rect
          width={item.width}
          height={item.height}
          offsetX={item.width / 2}
          offsetY={item.height / 2}
          cornerRadius={5}
          {...baseProps}
          fill="rgba(180, 140, 100, 0.85)"
          strokeWidth={2}
          stroke="rgba(140, 100, 60, 0.9)"
        />
        {/* Fabric lines */}
        {[...Array(6)].map((_, i) => (
          <Rect
            key={i}
            width={item.width - 10}
            height={2}
            x={-item.width / 2 + 5}
            y={-item.height / 2 + 5 + i * 8}
            fill="rgba(140, 100, 60, 0.5)"
          />
        ))}
      </>
    );
  }

  // Basking and platforms
  if (variant === 'basking-stone' || variant === 'large-rock' || variant === 'stone-pile') {
    return (
      <>
        {/* Shadow */}
        <RegularPolygon
          sides={6}
          radius={item.width / 2 + 3}
          fill="rgba(50, 50, 50, 0.4)"
          y={4}
        />
        {/* Main rock with stone texture */}
        <RegularPolygon
          sides={6}
          radius={item.width / 2}
          {...baseProps}
          fill="#787878"
          strokeWidth={3}
          stroke="#5A5A5A"
        />
        {/* Mid-tone layer */}
        <RegularPolygon
          sides={6}
          radius={item.width / 2.8}
          fill="#9CA3AF"
          opacity={0.6}
        />
        {/* Darker crevices */}
        <RegularPolygon
          sides={6}
          radius={item.width / 4}
          fill="rgba(80, 80, 80, 0.5)"
        />
        {/* Highlight on top-left */}
        <RegularPolygon
          sides={6}
          radius={item.width / 5}
          x={-item.width / 8}
          y={-item.width / 8}
          fill="rgba(220, 220, 220, 0.4)"
        />
      </>
    );
  }

  if (variant === 'platform' || variant === 'ledge' || variant === 'corner-shelf') {
    return (
      <>
        <Rect
          width={item.width}
          height={item.height}
          offsetX={item.width / 2}
          offsetY={item.height / 2}
          cornerRadius={3}
          {...baseProps}
          fill="rgba(160, 120, 80, 0.9)"
          strokeWidth={2}
          stroke="rgba(120, 90, 60, 0.9)"
        />
        {/* Platform support */}
        <Rect
          width={item.width - 15}
          height={item.height / 2}
          offsetX={(item.width - 15) / 2}
          y={item.height / 4}
          cornerRadius={2}
          fill="rgba(140, 100, 60, 0.6)"
        />
      </>
    );
  }

  // Feeding equipment
  if (variant === 'food-dish' || variant === 'worm-dish' || variant === 'supplement-dish') {
    const dishColor = variant === 'supplement-dish' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(200, 160, 120, 0.9)';
    return (
      <>
        <Circle
          radius={item.width / 2}
          {...baseProps}
          fill={dishColor}
          strokeWidth={2}
          stroke="rgba(140, 110, 80, 0.9)"
        />
        <Circle
          radius={item.width / 2.5}
          fill="rgba(160, 130, 90, 0.5)"
        />
        <Text
          y={-8}
          text={variant === 'worm-dish' ? '🐛' : variant === 'supplement-dish' ? '💊' : '🍽️'}
          fontSize={16}
          offsetX={8}
          align="center"
        />
      </>
    );
  }

  if (variant === 'feeding-ledge') {
    return (
      <>
        <Rect
          width={item.width}
          height={item.height}
          offsetX={item.width / 2}
          offsetY={item.height / 2}
          cornerRadius={3}
          {...baseProps}
          fill="rgba(180, 140, 100, 0.9)"
          strokeWidth={2}
          stroke="rgba(140, 100, 60, 0.9)"
        />
        <Circle
          y={-5}
          radius={15}
          fill="rgba(200, 160, 120, 0.8)"
          strokeWidth={1}
          stroke="rgba(140, 110, 80, 0.9)"
        />
      </>
    );
  }

  // Background panels
  if (variant === 'cork-bg' || variant === 'foam-bg' || variant === 'rock-wall') {
    return (
      <>
        <Rect
          width={item.width}
          height={item.height}
          offsetX={item.width / 2}
          offsetY={item.height / 2}
          cornerRadius={5}
          {...baseProps}
          fill={variant === 'cork-bg' ? 'rgba(139, 115, 85, 0.8)' : variant === 'foam-bg' ? 'rgba(180, 160, 140, 0.8)' : 'rgba(120, 120, 120, 0.8)'}
          strokeWidth={2}
          stroke="rgba(80, 70, 60, 0.9)"
        />
        {/* Texture pattern */}
        {[...Array(8)].map((_, i) => (
          <Circle
            key={i}
            x={-item.width / 3 + (i % 3) * (item.width / 3)}
            y={-item.height / 3 + Math.floor(i / 3) * (item.height / 3)}
            radius={8}
            fill="rgba(100, 80, 60, 0.3)"
          />
        ))}
      </>
    );
  }

  // Plants with specific variants
  if (variant === 'pothos') {
    return (
      <>
        {/* Pot base */}
        <Circle 
          y={item.height / 4} 
          radius={item.width / 4} 
          fill="rgba(139, 100, 65, 0.9)" 
          strokeWidth={2} 
          stroke="rgba(100, 70, 45, 0.9)" 
        />
        {/* Main foliage mass */}
        <Circle radius={item.width / 2.2} fill="rgba(50, 160, 80, 0.9)" {...baseProps} />
        {/* Trailing vines with heart-shaped leaves */}
        {[0, 1, 2, 3].map((i) => {
          const angle = (i * Math.PI) / 2 - Math.PI / 4;
          const trailLength = item.width / 2 + 15;
          return (
            <Group key={i}>
              {/* Vine stem */}
              {[0, 1, 2].map((j) => (
                <Circle
                  key={j}
                  x={Math.cos(angle) * (trailLength * 0.3 * (j + 1))}
                  y={Math.sin(angle) * (trailLength * 0.3 * (j + 1)) + j * 5}
                  radius={4 - j * 0.5}
                  fill="rgba(70, 140, 60, 0.85)"
                />
              ))}
              {/* Heart-shaped leaves */}
              {[0, 1, 2].map((j) => (
                <Group key={`leaf-${j}`}>
                  <Circle
                    x={Math.cos(angle) * (trailLength * 0.3 * (j + 1)) - 5}
                    y={Math.sin(angle) * (trailLength * 0.3 * (j + 1)) + j * 5}
                    radius={8}
                    fill="rgba(80, 200, 100, 0.9)"
                  />
                  <Circle
                    x={Math.cos(angle) * (trailLength * 0.3 * (j + 1)) + 5}
                    y={Math.sin(angle) * (trailLength * 0.3 * (j + 1)) + j * 5}
                    radius={8}
                    fill="rgba(80, 200, 100, 0.9)"
                  />
                </Group>
              ))}
            </Group>
          );
        })}
        {/* Top cluster highlights */}
        <Circle x={-8} y={-10} radius={14} fill="rgba(100, 220, 120, 0.85)" />
        <Circle x={10} y={-5} radius={12} fill="rgba(90, 210, 110, 0.85)" />
        <Circle radius={10} fill="rgba(120, 240, 140, 0.6)" />
      </>
    );
  }

  if (variant === 'snake-plant') {
    return (
      <>
        {/* Pot */}
        <Rect
          y={item.height / 3}
          width={item.width / 2}
          height={item.height / 4}
          offsetX={item.width / 4}
          cornerRadius={5}
          fill="rgba(180, 130, 90, 0.9)"
          strokeWidth={2}
          stroke="rgba(140, 100, 60, 0.9)"
        />
        {/* Tall pointed leaves */}
        {[0, 1, 2].map((i) => {
          const xPos = -20 + i * 20;
          const leafHeight = item.height * (0.7 + i * 0.1);
          return (
            <Group key={i}>
              {/* Leaf body */}
              <Rect
                x={xPos}
                width={15}
                height={leafHeight}
                offsetY={leafHeight / 2 - item.height / 6}
                cornerRadius={7}
                fill={i === 1 ? 'rgba(70, 150, 75, 0.95)' : 'rgba(60, 140, 70, 0.9)'}
                strokeWidth={2}
                stroke="rgba(40, 100, 50, 0.9)"
                rotation={i === 0 ? -8 : i === 2 ? 8 : 0}
                {...baseProps}
              />
              {/* Stripes/pattern */}
              {[0, 1, 2, 3].map((j) => (
                <Rect
                  key={j}
                  x={xPos}
                  y={-leafHeight / 3 + j * 20}
                  width={12}
                  height={3}
                  offsetX={6}
                  cornerRadius={1.5}
                  fill="rgba(120, 180, 110, 0.7)"
                  rotation={i === 0 ? -8 : i === 2 ? 8 : 0}
                />
              ))}
            </Group>
          );
        })}
      </>
    );
  }

  if (variant === 'bromeliad' || variant === 'air-plant') {
    return (
      <>
        {/* Center rosette */}
        <Circle radius={item.width / 2.5} fill="rgba(200, 80, 100, 0.9)" {...baseProps} />
        {/* Radiating leaves */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const angle = (i * Math.PI) / 4;
          const length = item.width / 2.2;
          return (
            <RegularPolygon
              key={i}
              x={Math.cos(angle) * length * 0.6}
              y={Math.sin(angle) * length * 0.6}
              sides={3}
              radius={length * 0.8}
              fill="rgba(220, 100, 120, 0.85)"
              rotation={angle * (180 / Math.PI) + 90}
              shadowColor="rgba(180, 60, 80, 0.4)"
              shadowBlur={6}
            />
          );
        })}
        {/* Center flower/cup */}
        <Circle radius={item.width / 5} fill="rgba(255, 180, 100, 0.9)" />
        <Circle radius={item.width / 7} fill="rgba(255, 220, 140, 0.8)" />
      </>
    );
  }

  if (variant === 'succulent') {
    return (
      <>
        {/* Pot */}
        <Circle 
          y={item.height / 4} 
          radius={item.width / 3.5} 
          fill="rgba(200, 150, 100, 0.9)" 
          strokeWidth={2} 
          stroke="rgba(160, 120, 80, 0.9)" 
        />
        {/* Succulent rosette */}
        <Circle radius={item.width / 2.5} fill="rgba(140, 180, 110, 0.9)" {...baseProps} />
        {/* Layered petals */}
        {[0, 1, 2].map((layer) => {
          const numPetals = 6 + layer * 2;
          const petalRadius = (item.width / (3 + layer * 0.5));
          return (
            <Group key={layer}>
              {[...Array(numPetals)].map((_, i) => {
                const angle = (i * Math.PI * 2) / numPetals + (layer * Math.PI) / numPetals;
                const distance = petalRadius * (0.5 + layer * 0.2);
                return (
                  <RegularPolygon
                    key={i}
                    x={Math.cos(angle) * distance}
                    y={Math.sin(angle) * distance}
                    sides={3}
                    radius={petalRadius * 0.8}
                    fill={`rgba(${150 + layer * 20}, ${190 + layer * 15}, ${120 + layer * 20}, 0.${90 - layer * 5})`}
                    rotation={angle * (180 / Math.PI) + 90}
                  />
                );
              })}
            </Group>
          );
        })}
        {/* Center highlight */}
        <Circle radius={item.width / 8} fill="rgba(220, 250, 180, 0.8)" />
      </>
    );
  }

  if (variant === 'moss') {
    return (
      <>
        <Rect
          width={item.width}
          height={item.height}
          offsetX={item.width / 2}
          offsetY={item.height / 2}
          cornerRadius={8}
          {...baseProps}
          fill="rgba(80, 140, 70, 0.9)"
        />
        {/* Moss texture with varied sizes */}
        {[...Array(20)].map((_, i) => {
          const x = -item.width / 2 + (i % 5) * (item.width / 4) + Math.random() * 10;
          const y = -item.height / 2 + Math.floor(i / 5) * (item.height / 4) + Math.random() * 10;
          const size = 4 + Math.random() * 6;
          return (
            <Circle
              key={i}
              x={x}
              y={y}
              radius={size}
              fill={`rgba(${100 + Math.random() * 40}, ${160 + Math.random() * 40}, ${80 + Math.random() * 30}, 0.${70 + Math.floor(Math.random() * 20)})`}
            />
          );
        })}
      </>
    );
  }

  if (variant === 'log' || variant === 'centerpiece') {
    return (
      <>
        <Rect
          width={item.width}
          height={item.height}
          offsetX={item.width / 2}
          offsetY={item.height / 2}
          cornerRadius={item.height / 3}
          {...baseProps}
          fill="rgba(120, 90, 60, 0.9)"
          strokeWidth={3}
          stroke="rgba(80, 60, 40, 0.9)"
        />
        {/* Wood rings */}
        {[...Array(3)].map((_, i) => (
          <Circle
            key={i}
            x={-item.width / 3 + 10}
            radius={10 + i * 8}
            stroke="rgba(90, 70, 50, 0.5)"
            strokeWidth={2}
          />
        ))}
      </>
    );
  }

  // Default decor rendering for unhandled variants
  return (
    <Circle
      radius={item.width / 2}
      {...baseProps}
      fill="rgba(50, 160, 80, 0.85)"
    />
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
