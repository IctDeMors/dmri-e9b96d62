import { useMemo } from "react";
import * as THREE from "three";
import type { WallPanel } from "./types";

interface WallPanel3DProps {
  panel: WallPanel;
  selected?: boolean;
  onClick?: () => void;
}

// Scale: 1000mm = 1 unit
const SCALE = 1 / 1000;
const PANEL_THICKNESS = 19; // 19mm panel thickness

/**
 * Creates a 3D shape for a wall panel with flanges.
 * 
 * The panel is a flat plate that gets bent/folded at the edges to create flanges.
 * Viewed from above (looking down at bathroom):
 * 
 *    OUTSIDE (away from bathroom)
 *         ↑
 *    ┌────┴────┐
 *    │         │  ← left flange (folded outward)
 *    │    ┌────┘
 *    │    │
 *    │    │  ← main panel (interior face)
 *    │    │
 *    │    └────┐
 *    │         │  ← right flange (folded outward)
 *    └────┬────┘
 *         ↓
 *    INSIDE (bathroom interior)
 * 
 * The flanges fold outward, perpendicular to the main panel face.
 */
export const WallPanel3D = ({ panel, selected, onClick }: WallPanel3DProps) => {
  const geometry = useMemo(() => {
    const w = panel.width * SCALE;
    const h = panel.height * SCALE;
    const t = PANEL_THICKNESS * SCALE;
    const leftFlange = panel.flange.type === "left" || panel.flange.type === "both" 
      ? panel.flange.leftWidth * SCALE 
      : 0;
    const rightFlange = panel.flange.type === "right" || panel.flange.type === "both" 
      ? panel.flange.rightWidth * SCALE 
      : 0;

    // Create the shape from the top view (X-Z plane)
    // X = along the wall width, Z = depth (into/out of bathroom)
    // Panel faces toward +Z (interior), flanges extend toward -Z (exterior)
    const shape = new THREE.Shape();

    // Start at interior face, left edge
    // Interior face is at Z = 0, exterior at Z = -t
    
    if (leftFlange > 0) {
      // Start at end of left flange (exterior)
      shape.moveTo(-w / 2 - leftFlange, -t);
      // Go along exterior of left flange
      shape.lineTo(-w / 2 - leftFlange, 0);
      // Interior edge of left flange, turn toward main panel
      shape.lineTo(-w / 2, 0);
    } else {
      // Start at left edge of main panel, exterior
      shape.moveTo(-w / 2, -t);
      shape.lineTo(-w / 2, 0);
    }
    
    // Along interior face of main panel to right side
    if (rightFlange > 0) {
      shape.lineTo(w / 2, 0);
      // Interior edge of right flange
      shape.lineTo(w / 2 + rightFlange, 0);
      // Exterior edge of right flange
      shape.lineTo(w / 2 + rightFlange, -t);
      // Back along exterior of right flange
      shape.lineTo(w / 2, -t);
    } else {
      shape.lineTo(w / 2, 0);
      shape.lineTo(w / 2, -t);
    }
    
    // Back along exterior of main panel
    if (leftFlange > 0) {
      shape.lineTo(-w / 2, -t);
      shape.lineTo(-w / 2 - leftFlange, -t);
    } else {
      shape.lineTo(-w / 2, -t);
    }

    // Extrude upward (Y direction)
    const extrudeSettings = {
      steps: 1,
      depth: h,
      bevelEnabled: false,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Rotate so it stands upright: extrusion was along Z, rotate to be along Y
    geo.rotateX(-Math.PI / 2);
    
    return geo;
  }, [panel.width, panel.height, panel.flange]);

  const x = panel.x * SCALE;
  const z = panel.z * SCALE;
  const rotationY = (panel.rotation * Math.PI) / 180;

  return (
    <mesh
      geometry={geometry}
      position={[x, 0, z]}
      rotation={[0, rotationY, 0]}
      castShadow
      receiveShadow
      onClick={onClick}
    >
      <meshStandardMaterial 
        color={selected ? "#4A90D9" : "#B8B8B0"} 
        roughness={0.5}
        metalness={0.2}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

/**
 * Helper component to render multiple wall panels
 */
interface WallPanelsProps {
  panels: WallPanel[];
  selectedId?: string;
  onSelectPanel?: (id: string) => void;
}

export const WallPanels = ({ panels, selectedId, onSelectPanel }: WallPanelsProps) => {
  return (
    <group>
      {panels.map((panel) => (
        <WallPanel3D
          key={panel.id}
          panel={panel}
          selected={selectedId === panel.id}
          onClick={() => onSelectPanel?.(panel.id)}
        />
      ))}
    </group>
  );
};
