import { useMemo } from "react";
import * as THREE from "three";
import type { WallPanel, FlangeConfig } from "./types";

interface WallPanel3DProps {
  panel: WallPanel;
  selected?: boolean;
  onClick?: () => void;
}

// Scale: 1000mm = 1 unit
const SCALE = 1 / 1000;
const PANEL_THICKNESS = 19; // 19mm panel thickness

/**
 * Creates a 3D shape for a wall panel with flanges
 * Flange types:
 * - __|  (right flange only)
 * - |__| (both flanges)
 * - |__  (left flange only)
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
    const shape = new THREE.Shape();

    // Start at bottom-left of main panel
    shape.moveTo(-w / 2, 0);

    // Left flange (if present) - goes backward (negative Z)
    if (leftFlange > 0) {
      shape.lineTo(-w / 2, -leftFlange);
      shape.lineTo(-w / 2 + t, -leftFlange);
      shape.lineTo(-w / 2 + t, -t);
      shape.lineTo(-w / 2 + t, 0);
    }

    // Top edge of main panel
    shape.lineTo(w / 2 - (rightFlange > 0 ? t : 0), 0);

    // Right flange (if present) - goes backward (negative Z)
    if (rightFlange > 0) {
      shape.lineTo(w / 2 - t, -t);
      shape.lineTo(w / 2 - t, -rightFlange);
      shape.lineTo(w / 2, -rightFlange);
      shape.lineTo(w / 2, 0);
    } else {
      shape.lineTo(w / 2, 0);
    }

    // Bottom edge - main panel thickness
    shape.lineTo(w / 2, t);
    shape.lineTo(-w / 2, t);
    shape.lineTo(-w / 2, 0);

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
