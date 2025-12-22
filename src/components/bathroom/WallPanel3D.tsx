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
 * Creates a 3D shape for a wall panel with flanges pointing OUTWARD
 * View from inside bathroom looking at wall:
 * - Flanges bend away from viewer (toward outside of bathroom)
 * 
 * Flange types (viewed from inside):
 * - __|  (right flange - bends outward on right side)
 * - |__| (both flanges - bends outward on both sides)
 * - |__  (left flange - bends outward on left side)
 * - __   (no flanges, flat panel)
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

    // Create the shape from the top view (X-Z plane, extruded along Y)
    // Panel faces +Z direction (toward inside of bathroom)
    // Flanges go toward -Z direction (toward outside of bathroom)
    const shape = new THREE.Shape();

    // Start at front-left of main panel (inside face)
    shape.moveTo(-w / 2, t);

    // Left flange (if present) - goes backward (toward outside, positive Z in local coords means toward back)
    if (leftFlange > 0) {
      // Go to back of main panel
      shape.lineTo(-w / 2, 0);
      // Extend flange outward (away from bathroom interior)
      shape.lineTo(-w / 2 - leftFlange, 0);
      shape.lineTo(-w / 2 - leftFlange, t);
      shape.lineTo(-w / 2 - t, t);
    } else {
      shape.lineTo(-w / 2, 0);
    }

    // Back edge of main panel
    if (leftFlange > 0) {
      shape.lineTo(-w / 2, 0);
    }
    
    // Move along back of panel to right side
    if (rightFlange > 0) {
      shape.lineTo(w / 2, 0);
      // Right flange extends outward
      shape.lineTo(w / 2 + rightFlange, 0);
      shape.lineTo(w / 2 + rightFlange, t);
      shape.lineTo(w / 2, t);
    } else {
      shape.lineTo(w / 2, 0);
      shape.lineTo(w / 2, t);
    }

    // Front edge back to start
    shape.lineTo(-w / 2, t);

    // Extrude settings
    const extrudeSettings = {
      steps: 1,
      depth: h,
      bevelEnabled: false,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Rotate so it stands upright (Y is up)
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
        color={selected ? "#4A90D9" : "#F0F0F0"} 
        roughness={0.6}
        metalness={0.1}
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
