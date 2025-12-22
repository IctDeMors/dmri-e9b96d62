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
 * Creates a 3D wall panel with optional flanges on left and/or right side.
 * 
 * Top-down view (looking at floor):
 * 
 *       LEFT FLANGE          MAIN PANEL           RIGHT FLANGE
 *           ║                                          ║
 *           ║←── leftFlange ──→║←── width ──→║←── rightFlange ──→║
 *           ║                  ║             ║                   ║
 *    ═══════╝                  ╚═════════════╝                   ╚═══════
 *    
 * Interior face (Z=0) faces toward bathroom interior
 * Flanges extend perpendicular, toward the outside (negative Z)
 */
export const WallPanel3D = ({ panel, selected, onClick }: WallPanel3DProps) => {
  const geometry = useMemo(() => {
    const w = panel.width * SCALE;
    const h = panel.height * SCALE;
    const t = PANEL_THICKNESS * SCALE;
    const leftF = panel.flange.type === "left" || panel.flange.type === "both" 
      ? panel.flange.leftWidth * SCALE 
      : 0;
    const rightF = panel.flange.type === "right" || panel.flange.type === "both" 
      ? panel.flange.rightWidth * SCALE 
      : 0;

    // Create shape in X-Z plane (top-down view)
    // X = along wall width, Z = depth
    // Interior face at Z = t, exterior at Z = 0
    // Flanges extend in -Z direction from the ends
    const shape = new THREE.Shape();
    
    const halfW = w / 2;
    
    // Start at bottom-left of main panel (exterior side)
    shape.moveTo(-halfW, 0);
    
    // Left flange (if present)
    if (leftF > 0) {
      shape.lineTo(-halfW, -leftF);      // Extend left flange outward
      shape.lineTo(-halfW - t, -leftF);  // Flange thickness
      shape.lineTo(-halfW - t, t);       // Back to main panel level
      shape.lineTo(-halfW, t);           // Interior corner
    } else {
      shape.lineTo(-halfW, t);           // Just go to interior face
    }
    
    // Along interior face to right side
    shape.lineTo(halfW, t);
    
    // Right flange (if present)
    if (rightF > 0) {
      shape.lineTo(halfW + t, t);        // Start of right flange
      shape.lineTo(halfW + t, -rightF);  // Flange extends outward
      shape.lineTo(halfW, -rightF);      // Flange thickness
      shape.lineTo(halfW, 0);            // Back to exterior
    } else {
      shape.lineTo(halfW, 0);            // Just exterior corner
    }
    
    // Close the shape along exterior
    shape.lineTo(-halfW, 0);

    // Extrude upward for wall height
    const extrudeSettings = {
      steps: 1,
      depth: h,
      bevelEnabled: false,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Rotate to stand upright (extrusion was +Z, needs to be +Y)
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
