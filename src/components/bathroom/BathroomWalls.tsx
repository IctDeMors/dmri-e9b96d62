import { useMemo } from "react";
import type { BathroomConfig } from "./types";

interface BathroomWallsProps {
  config: BathroomConfig;
}

// Scale: 1000mm = 1 unit
const SCALE = 1 / 1000;
const WALL_THICKNESS = 19; // 19mm panel thickness

export const BathroomWalls = ({ config }: BathroomWallsProps) => {
  const { dimensions, floorShape, lShapeConfig } = config;
  
  const walls = useMemo(() => {
    const w = dimensions.width * SCALE;
    const d = dimensions.depth * SCALE;
    const h = dimensions.height * SCALE;
    const t = WALL_THICKNESS * SCALE;
    
    const wallPieces: Array<{
      id: string;
      position: [number, number, number];
      size: [number, number, number];
    }> = [];
    
    if (floorShape === "rectangle") {
      // Back wall
      wallPieces.push({
        id: "back",
        position: [0, h / 2, -d / 2 + t / 2],
        size: [w, h, t],
      });
      // Left wall
      wallPieces.push({
        id: "left",
        position: [-w / 2 + t / 2, h / 2, 0],
        size: [t, h, d],
      });
      // Right wall
      wallPieces.push({
        id: "right",
        position: [w / 2 - t / 2, h / 2, 0],
        size: [t, h, d],
      });
    } else if (floorShape === "l-shape" && lShapeConfig) {
      const cutW = lShapeConfig.cutoutWidth * SCALE;
      const cutD = lShapeConfig.cutoutDepth * SCALE;
      
      // Generate L-shape walls based on cutout corner
      switch (lShapeConfig.cutoutCorner) {
        case "top-right":
          // Back wall (full width until cutout)
          wallPieces.push({
            id: "back-1",
            position: [-(cutW / 2), h / 2, -d / 2 + t / 2],
            size: [w - cutW, h, t],
          });
          // Back wall inner segment
          wallPieces.push({
            id: "back-inner",
            position: [w / 2 - cutW / 2, h / 2, -d / 2 + cutD + t / 2],
            size: [cutW, h, t],
          });
          // Left wall
          wallPieces.push({
            id: "left",
            position: [-w / 2 + t / 2, h / 2, 0],
            size: [t, h, d],
          });
          // Right wall (partial)
          wallPieces.push({
            id: "right",
            position: [w / 2 - t / 2, h / 2, cutD / 2],
            size: [t, h, d - cutD],
          });
          // Inner wall horizontal
          wallPieces.push({
            id: "inner-h",
            position: [w / 2 - cutW / 2, h / 2, -d / 2 + cutD - t / 2],
            size: [cutW, h, t],
          });
          break;
        default:
          // Simple walls for other configurations
          wallPieces.push({
            id: "back",
            position: [0, h / 2, -d / 2 + t / 2],
            size: [w, h, t],
          });
          wallPieces.push({
            id: "left",
            position: [-w / 2 + t / 2, h / 2, 0],
            size: [t, h, d],
          });
          wallPieces.push({
            id: "right",
            position: [w / 2 - t / 2, h / 2, 0],
            size: [t, h, d],
          });
      }
    }
    
    return wallPieces;
  }, [dimensions, floorShape, lShapeConfig]);

  return (
    <group>
      {walls.map((wall) => (
        <mesh key={wall.id} position={wall.position} castShadow receiveShadow>
          <boxGeometry args={wall.size} />
          <meshStandardMaterial color="#F5F5F0" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
};
