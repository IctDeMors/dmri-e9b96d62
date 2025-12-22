import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
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
 * Uses separate box geometries for main panel and flanges to avoid self-intersecting shapes.
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

    const flipFlanges = panel.flipFlanges ?? false;
    const geometries: THREE.BufferGeometry[] = [];
    
    // Main panel: width x height x thickness
    // Centered at origin, thickness extends in -Z direction
    const mainPanel = new THREE.BoxGeometry(w, h, t);
    mainPanel.translate(0, h / 2, -t / 2);
    geometries.push(mainPanel);
    
    // Flanges extend perpendicular to the panel
    // flipFlanges determines direction: false = -Z (exterior), true = +Z (interior)
    const flangeDir = flipFlanges ? 1 : -1;
    
    // Left flange
    if (leftF > 0) {
      const leftFlange = new THREE.BoxGeometry(t, h, leftF);
      // Position: at left edge of panel, extending in flange direction
      // X: -w/2 - t/2 (outside left edge)
      // Z: flangeDir * leftF/2 (extending in flange direction from interior face)
      leftFlange.translate(-w / 2 - t / 2, h / 2, flangeDir * leftF / 2);
      geometries.push(leftFlange);
    }
    
    // Right flange
    if (rightF > 0) {
      const rightFlange = new THREE.BoxGeometry(t, h, rightF);
      // Position: at right edge of panel, extending in flange direction
      rightFlange.translate(w / 2 + t / 2, h / 2, flangeDir * rightF / 2);
      geometries.push(rightFlange);
    }
    
    // Merge all geometries into one
    const merged = mergeGeometries(geometries, false);
    
    // Dispose individual geometries
    geometries.forEach(g => g.dispose());
    
    return merged;
  }, [panel.width, panel.height, panel.flange, panel.flipFlanges]);

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
