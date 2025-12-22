import { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { SanitaryItem, SanitaryType } from "./types";

interface SanitaryItemMeshProps {
  item: SanitaryItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  isDragging: boolean;
  onStartDrag: () => void;
  onEndDrag: () => void;
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

export const SanitaryItemMesh = ({ 
  item, 
  isSelected, 
  onSelect, 
  isDragging,
  onStartDrag,
  onEndDrag
}: SanitaryItemMeshProps) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const dims = DIMENSIONS[item.type];
  const w = dims.width * SCALE;
  const d = dims.depth * SCALE;
  const h = dims.height * SCALE;

  const handleClick = (e: any) => {
    e.stopPropagation();
    onSelect(item.id);
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    onSelect(item.id);
    onStartDrag();
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    onEndDrag();
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

  // Get bounding box size for selection ring
  const maxSize = Math.max(w, d) / 2 + 0.1;

  return (
    <group
      ref={groupRef}
      position={[item.position.x * SCALE, 0, item.position.z * SCALE]}
      rotation={[0, (item.rotation * Math.PI) / 180, 0]}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {renderItem()}
      {/* Selection highlight - ground ring */}
      {isSelected && (
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[maxSize, maxSize + 0.05, 32]} />
          <meshBasicMaterial color="#3B82F6" side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* Invisible hit area for easier clicking */}
      <mesh visible={false}>
        <boxGeometry args={[w + 0.1, h + 0.1, d + 0.1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
};

interface SanitaryItemsProps {
  items: SanitaryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDrag: (id: string, position: { x: number; z: number }) => void;
  bathroomDimensions: { width: number; depth: number };
}

export const SanitaryItems = ({ 
  items, 
  selectedId, 
  onSelect, 
  onDrag,
  bathroomDimensions
}: SanitaryItemsProps) => {
  const { gl, camera, raycaster } = useThree();
  const isDraggingRef = useRef(false);
  const floorPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current || !selectedId) return;
      
      // Calculate normalized device coordinates
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Raycast to floor plane
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(floorPlaneRef.current, intersection);
      
      if (intersection) {
        // Convert to mm and snap to walls
        const posX = intersection.x / SCALE;
        const posZ = intersection.z / SCALE;
        
        // Get item dimensions
        const item = items.find(i => i.id === selectedId);
        if (item) {
          const dims = DIMENSIONS[item.type];
          const halfW = dims.width / 2;
          const halfD = dims.depth / 2;
          
          // Snap to nearest wall (within threshold)
          const snapThreshold = 200; // 200mm snap distance
          const wallOffset = 50; // 50mm from wall
          
          const halfBathW = bathroomDimensions.width / 2;
          const halfBathD = bathroomDimensions.depth / 2;
          
          let snappedX = posX;
          let snappedZ = posZ;
          
          // Check distance to each wall and snap if close
          // Left wall
          if (Math.abs(posX - (-halfBathW + halfD + wallOffset)) < snapThreshold) {
            snappedX = -halfBathW + halfD + wallOffset;
          }
          // Right wall
          if (Math.abs(posX - (halfBathW - halfD - wallOffset)) < snapThreshold) {
            snappedX = halfBathW - halfD - wallOffset;
          }
          // Back wall
          if (Math.abs(posZ - (-halfBathD + halfD + wallOffset)) < snapThreshold) {
            snappedZ = -halfBathD + halfD + wallOffset;
          }
          
          // Clamp to bathroom bounds
          const clampedX = Math.max(-halfBathW + halfW + wallOffset, Math.min(halfBathW - halfW - wallOffset, snappedX));
          const clampedZ = Math.max(-halfBathD + halfD + wallOffset, Math.min(halfBathD, snappedZ));
          
          onDrag(selectedId, { x: clampedX, z: clampedZ });
        }
      }
    };
    
    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };
    
    gl.domElement.addEventListener('pointermove', handlePointerMove);
    gl.domElement.addEventListener('pointerup', handlePointerUp);
    
    return () => {
      gl.domElement.removeEventListener('pointermove', handlePointerMove);
      gl.domElement.removeEventListener('pointerup', handlePointerUp);
    };
  }, [gl, camera, raycaster, selectedId, onDrag, items, bathroomDimensions]);

  const handleStartDrag = () => {
    isDraggingRef.current = true;
  };
  
  const handleEndDrag = () => {
    isDraggingRef.current = false;
  };

  return (
    <group>
      {items.map((item) => (
        <SanitaryItemMesh
          key={item.id}
          item={item}
          isSelected={selectedId === item.id}
          onSelect={onSelect}
          isDragging={isDraggingRef.current && selectedId === item.id}
          onStartDrag={handleStartDrag}
          onEndDrag={handleEndDrag}
        />
      ))}
    </group>
  );
};
