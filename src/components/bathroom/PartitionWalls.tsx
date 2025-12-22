import type { PartitionWall } from "./types";

interface PartitionWallsProps {
  walls: PartitionWall[];
  bathroomHeight: number;
}

// Scale: 1000mm = 1 unit
const SCALE = 1 / 1000;
const WALL_THICKNESS = 19; // 19mm panel thickness

export const PartitionWalls = ({ walls, bathroomHeight }: PartitionWallsProps) => {
  return (
    <group>
      {walls.map((wall) => {
        const startX = wall.startX * SCALE;
        const startZ = wall.startZ * SCALE;
        const endX = wall.endX * SCALE;
        const endZ = wall.endZ * SCALE;
        
        const dx = endX - startX;
        const dz = endZ - startZ;
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx);
        
        const h = (wall.height || bathroomHeight) * SCALE;
        const t = WALL_THICKNESS * SCALE;
        
        const centerX = (startX + endX) / 2;
        const centerZ = (startZ + endZ) / 2;

        return (
          <mesh
            key={wall.id}
            position={[centerX, h / 2, centerZ]}
            rotation={[0, -angle, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[length, h, t]} />
            <meshStandardMaterial color="#F0F0F0" roughness={0.6} />
          </mesh>
        );
      })}
    </group>
  );
};
