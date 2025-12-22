import { useMemo } from "react";
import * as THREE from "three";
import type { BathroomConfig } from "./types";

interface BathroomFloorProps {
  config: BathroomConfig;
}

// Scale: 1000mm = 1 unit
const SCALE = 1 / 1000;

export const BathroomFloor = ({ config }: BathroomFloorProps) => {
  const { dimensions, floorShape, lShapeConfig } = config;
  
  const geometry = useMemo(() => {
    const w = dimensions.width * SCALE;
    const d = dimensions.depth * SCALE;
    
    if (floorShape === "l-shape" && lShapeConfig) {
      // Create L-shape using shape
      const shape = new THREE.Shape();
      const cutW = lShapeConfig.cutoutWidth * SCALE;
      const cutD = lShapeConfig.cutoutDepth * SCALE;
      
      switch (lShapeConfig.cutoutCorner) {
        case "top-right":
          shape.moveTo(0, 0);
          shape.lineTo(w, 0);
          shape.lineTo(w, d - cutD);
          shape.lineTo(w - cutW, d - cutD);
          shape.lineTo(w - cutW, d);
          shape.lineTo(0, d);
          shape.closePath();
          break;
        case "top-left":
          shape.moveTo(cutW, 0);
          shape.lineTo(w, 0);
          shape.lineTo(w, d);
          shape.lineTo(0, d);
          shape.lineTo(0, d - cutD);
          shape.lineTo(cutW, d - cutD);
          shape.closePath();
          break;
        case "bottom-right":
          shape.moveTo(0, 0);
          shape.lineTo(w - cutW, 0);
          shape.lineTo(w - cutW, cutD);
          shape.lineTo(w, cutD);
          shape.lineTo(w, d);
          shape.lineTo(0, d);
          shape.closePath();
          break;
        case "bottom-left":
        default:
          shape.moveTo(0, cutD);
          shape.lineTo(cutW, cutD);
          shape.lineTo(cutW, 0);
          shape.lineTo(w, 0);
          shape.lineTo(w, d);
          shape.lineTo(0, d);
          shape.closePath();
          break;
      }
      
      const extrudeSettings = { depth: 0.08, bevelEnabled: false };
      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }
    
    // Simple rectangle
    return new THREE.BoxGeometry(w, 0.08, d);
  }, [dimensions, floorShape, lShapeConfig]);

  const centerOffset = useMemo(() => {
    const w = dimensions.width * SCALE;
    const d = dimensions.depth * SCALE;
    
    if (floorShape === "l-shape") {
      // For extruded geometry, center it
      return { x: -w / 2, y: 0, z: -d / 2 };
    }
    return { x: 0, y: 0, z: 0 };
  }, [dimensions, floorShape]);

  if (floorShape === "l-shape") {
    return (
      <mesh 
        position={[centerOffset.x, -0.04, centerOffset.z]} 
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <primitive object={geometry} attach="geometry" />
        <meshStandardMaterial color="#E8E4E1" roughness={0.8} />
      </mesh>
    );
  }

  return (
    <mesh position={[0, -0.04, 0]} receiveShadow>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial color="#E8E4E1" roughness={0.8} />
    </mesh>
  );
};
