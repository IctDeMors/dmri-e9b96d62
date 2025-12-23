import { useMemo } from "react";
import * as THREE from "three";
import type { BathroomConfig } from "./types";

interface BathroomFloorProps {
  config: BathroomConfig;
}

// Scale: 1000mm = 1 unit
const SCALE = 1 / 1000;
const FLOOR_THICKNESS = 80; // 8 cm in mm
const WALL_RECESS = 20; // 2 cm recess where walls sit
const FINISHING_THICKNESS = 10; // 1 cm finishing layer
const FLOOR_COLOR = "#87CEEB"; // Light blue
const FINISHING_COLOR = "#D3D3D3"; // Light gray

export const BathroomFloor = ({ config }: BathroomFloorProps) => {
  const { dimensions, floorShape, lShapeConfig } = config;
  
  // Create floor shape for both main floor and finishing layer
  const createFloorShape = (w: number, d: number, cutW?: number, cutD?: number, corner?: string) => {
    const shape = new THREE.Shape();
    
    if (corner && cutW && cutD) {
      switch (corner) {
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
    } else {
      shape.moveTo(0, 0);
      shape.lineTo(w, 0);
      shape.lineTo(w, d);
      shape.lineTo(0, d);
      shape.closePath();
    }
    
    return shape;
  };
  
  // Main floor geometry (full thickness)
  const mainFloorGeometry = useMemo(() => {
    const w = dimensions.width * SCALE;
    const d = dimensions.depth * SCALE;
    const thickness = FLOOR_THICKNESS * SCALE;
    
    if (floorShape === "l-shape" && lShapeConfig) {
      const cutW = lShapeConfig.cutoutWidth * SCALE;
      const cutD = lShapeConfig.cutoutDepth * SCALE;
      const shape = createFloorShape(w, d, cutW, cutD, lShapeConfig.cutoutCorner);
      const extrudeSettings = { depth: thickness, bevelEnabled: false };
      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }
    
    // Simple rectangle
    return new THREE.BoxGeometry(w, thickness, d);
  }, [dimensions, floorShape, lShapeConfig]);

  // Finishing layer geometry (1 cm on top of main floor, inside wall area)
  const finishingGeometry = useMemo(() => {
    const w = dimensions.width * SCALE;
    const d = dimensions.depth * SCALE;
    const thickness = FINISHING_THICKNESS * SCALE;
    
    if (floorShape === "l-shape" && lShapeConfig) {
      const cutW = lShapeConfig.cutoutWidth * SCALE;
      const cutD = lShapeConfig.cutoutDepth * SCALE;
      const shape = createFloorShape(w, d, cutW, cutD, lShapeConfig.cutoutCorner);
      const extrudeSettings = { depth: thickness, bevelEnabled: false };
      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }
    
    // Simple rectangle
    return new THREE.BoxGeometry(w, thickness, d);
  }, [dimensions, floorShape, lShapeConfig]);

  const centerOffset = useMemo(() => {
    const w = dimensions.width * SCALE;
    const d = dimensions.depth * SCALE;
    
    if (floorShape === "l-shape") {
      return { x: -w / 2, z: -d / 2 };
    }
    return { x: 0, z: 0 };
  }, [dimensions, floorShape]);

  const floorThickness = FLOOR_THICKNESS * SCALE;
  const recessDepth = WALL_RECESS * SCALE;
  const finishingThickness = FINISHING_THICKNESS * SCALE;
  
  // Position main floor so top surface is at y = recessDepth (walls sit at y = 0)
  const floorY = recessDepth - floorThickness / 2;
  // Finishing layer sits on top of main floor, top at y = recessDepth + finishingThickness
  const finishingY = recessDepth + finishingThickness / 2;

  if (floorShape === "l-shape") {
    return (
      <group>
        {/* Main floor */}
        <mesh 
          position={[centerOffset.x, floorY, centerOffset.z]} 
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <primitive object={mainFloorGeometry} attach="geometry" />
          <meshStandardMaterial color={FLOOR_COLOR} roughness={0.8} />
        </mesh>
        {/* Finishing layer */}
        <mesh 
          position={[centerOffset.x, finishingY, centerOffset.z]} 
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <primitive object={finishingGeometry} attach="geometry" />
          <meshStandardMaterial color={FINISHING_COLOR} roughness={0.6} />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      {/* Main floor */}
      <mesh position={[0, floorY, 0]} receiveShadow>
        <primitive object={mainFloorGeometry} attach="geometry" />
        <meshStandardMaterial color={FLOOR_COLOR} roughness={0.8} />
      </mesh>
      {/* Finishing layer */}
      <mesh position={[0, finishingY, 0]} receiveShadow>
        <primitive object={finishingGeometry} attach="geometry" />
        <meshStandardMaterial color={FINISHING_COLOR} roughness={0.6} />
      </mesh>
    </group>
  );
};
