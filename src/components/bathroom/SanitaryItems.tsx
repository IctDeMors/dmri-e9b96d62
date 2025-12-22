import { useState } from "react";
import { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { SanitaryItem, SanitaryType } from "./types";

interface SanitaryItemMeshProps {
  item: SanitaryItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDrag: (id: string, position: { x: number; z: number }) => void;
}

// Scale: 1000mm = 1 unit
const SCALE = 1 / 1000;

const DIMENSIONS: Record<SanitaryType, { width: number; depth: number; height: number }> = {
  shower: { width: 900, depth: 900, height: 2100 },
  toilet: { width: 400, depth: 600, height: 450 },
  vanity: { width: 800, depth: 500, height: 850 },
};

const COLORS: Record<SanitaryType, string> = {
  shower: "#87CEEB",
  toilet: "#FFFFFF",
  vanity: "#8B4513",
};

export const SanitaryItemMesh = ({ item, isSelected, onSelect, onDrag }: SanitaryItemMeshProps) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const dims = DIMENSIONS[item.type];
  const w = dims.width * SCALE;
  const d = dims.depth * SCALE;
  const h = dims.height * SCALE;
  
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onSelect(item.id);
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  
  const handlePointerUp = () => {
    setIsDragging(false);
  };
  
  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (isDragging && e.point) {
      onDrag(item.id, { x: e.point.x, z: e.point.z });
    }
  };

  const renderItem = () => {
    switch (item.type) {
      case "shower":
        return (
          <group>
            {/* Shower tray */}
            <mesh position={[0, 0.025, 0]} castShadow>
              <boxGeometry args={[w, 0.05, d]} />
              <meshStandardMaterial color="#E0E0E0" roughness={0.3} />
            </mesh>
            {/* Glass walls */}
            <mesh position={[0, h / 2, -d / 2 + 0.01]} castShadow>
              <boxGeometry args={[w, h, 0.02]} />
              <meshStandardMaterial color={COLORS.shower} transparent opacity={0.4} roughness={0.1} />
            </mesh>
            <mesh position={[-w / 2 + 0.01, h / 2, 0]} castShadow>
              <boxGeometry args={[0.02, h, d]} />
              <meshStandardMaterial color={COLORS.shower} transparent opacity={0.4} roughness={0.1} />
            </mesh>
          </group>
        );
      
      case "toilet":
        return (
          <group>
            {/* Bowl */}
            <mesh position={[0, 0.2, 0.05]} castShadow>
              <cylinderGeometry args={[0.15, 0.18, 0.4, 16]} />
              <meshStandardMaterial color={COLORS.toilet} roughness={0.2} />
            </mesh>
            {/* Tank */}
            <mesh position={[0, 0.35, -0.2]} castShadow>
              <boxGeometry args={[0.35, 0.3, 0.15]} />
              <meshStandardMaterial color={COLORS.toilet} roughness={0.2} />
            </mesh>
          </group>
        );
      
      case "vanity":
        return (
          <group>
            {/* Cabinet */}
            <mesh position={[0, 0.35, 0]} castShadow>
              <boxGeometry args={[w, 0.7, d]} />
              <meshStandardMaterial color={COLORS.vanity} roughness={0.5} />
            </mesh>
            {/* Countertop */}
            <mesh position={[0, 0.72, 0]} castShadow>
              <boxGeometry args={[w + 0.02, 0.04, d + 0.02]} />
              <meshStandardMaterial color="#E8E8E8" roughness={0.2} />
            </mesh>
            {/* Sink */}
            <mesh position={[0, 0.74, 0.05]} castShadow>
              <cylinderGeometry args={[0.2, 0.18, 0.08, 32]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.1} />
            </mesh>
          </group>
        );
    }
  };

  return (
    <group
      position={[item.position.x * SCALE, 0, item.position.z * SCALE]}
      rotation={[0, (item.rotation * Math.PI) / 180, 0]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
    >
      {renderItem()}
      {/* Selection highlight */}
      {isSelected && (
        <mesh position={[0, 0.01, 0]}>
          <ringGeometry args={[0.4, 0.45, 32]} />
          <meshBasicMaterial color="#3B82F6" side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};

interface SanitaryItemsProps {
  items: SanitaryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDrag: (id: string, position: { x: number; z: number }) => void;
}

export const SanitaryItems = ({ items, selectedId, onSelect, onDrag }: SanitaryItemsProps) => {
  return (
    <group>
      {items.map((item) => (
        <SanitaryItemMesh
          key={item.id}
          item={item}
          isSelected={selectedId === item.id}
          onSelect={onSelect}
          onDrag={onDrag}
        />
      ))}
    </group>
  );
};
