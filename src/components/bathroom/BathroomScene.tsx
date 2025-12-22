import { useRef } from "react";
import { OrbitControls, Grid } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { BathroomFloor } from "./BathroomFloor";
import { BathroomWalls } from "./BathroomWalls";
import { SanitaryItems } from "./SanitaryItems";
import { PartitionWalls } from "./PartitionWalls";
import type { BathroomConfig } from "./types";

interface BathroomSceneProps {
  config: BathroomConfig;
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  onDragItem: (id: string, position: { x: number; z: number }) => void;
  controlsRef?: React.RefObject<OrbitControlsImpl>;
}

// Scale: 1000mm = 1 unit
const SCALE = 1 / 1000;

export const BathroomScene = ({
  config,
  selectedItemId,
  onSelectItem,
  onDragItem,
  controlsRef,
}: BathroomSceneProps) => {
  const localControlsRef = useRef<OrbitControlsImpl>(null);
  const controls = controlsRef || localControlsRef;

  const w = config.dimensions.width * SCALE;
  const d = config.dimensions.depth * SCALE;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />

      {/* Grid for reference */}
      {config.showGrid && (
        <Grid
          position={[0, 0.001, 0]}
          args={[10, 10]}
          cellSize={0.1}
          cellThickness={0.5}
          cellColor="#6b7280"
          sectionSize={1}
          sectionThickness={1}
          sectionColor="#374151"
          fadeDistance={15}
          fadeStrength={1}
          followCamera={false}
        />
      )}

      {/* Floor */}
      <BathroomFloor config={config} />

      {/* Walls */}
      <BathroomWalls config={config} />

      {/* Partition Walls */}
      <PartitionWalls
        walls={config.partitionWalls}
        bathroomHeight={config.dimensions.height}
      />

      {/* Sanitary Items */}
      <SanitaryItems
        items={config.sanitaryItems}
        selectedId={selectedItemId}
        onSelect={onSelectItem}
        onDrag={onDragItem}
      />

      {/* Floor plane for drag detection */}
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
        onPointerMove={(e) => {
          if (selectedItemId && e.buttons === 1) {
            onDragItem(selectedItemId, { x: e.point.x / SCALE, z: e.point.z / SCALE });
          }
        }}
      >
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Camera Controls */}
      <OrbitControls
        ref={controls}
        enableZoom={true}
        enablePan={true}
        maxPolarAngle={Math.PI / 2}
        minDistance={1}
        maxDistance={15}
        target={[0, 0.5, 0]}
      />
    </>
  );
};
