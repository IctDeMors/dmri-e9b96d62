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
 * The panel is extruded upward (Y axis) with flanges extending outward.
 * flipFlanges controls which direction (interior or exterior) the flanges point.
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
    const shape = new THREE.Shape();
    
    const halfW = w / 2;
    
    // We draw the profile in X-Z plane looking from top
    // X = width direction, Z = depth (perpendicular to wall face)
    // Interior is at Z=0, exterior is at Z=-t (panel thickness going outward)
    
    if (flipFlanges) {
      // For front/back walls: flanges extend toward +Z (interior)
      // This makes them wrap around the side wall panels from inside
      
      // Start at exterior face, left edge
      shape.moveTo(-halfW, -t);
      
      // Left flange going toward interior (+Z)
      if (leftF > 0) {
        shape.lineTo(-halfW - t, -t);      // Flange starts at exterior
        shape.lineTo(-halfW - t, leftF);   // Flange extends into interior
        shape.lineTo(-halfW, leftF);       // Inner edge of flange
        shape.lineTo(-halfW, 0);           // Back to panel interior face
      } else {
        shape.lineTo(-halfW, 0);
      }
      
      // Interior face
      shape.lineTo(halfW, 0);
      
      // Right flange going toward interior (+Z)
      if (rightF > 0) {
        shape.lineTo(halfW, rightF);       // Start of flange at interior
        shape.lineTo(halfW + t, rightF);   // Outer edge of flange
        shape.lineTo(halfW + t, -t);       // Flange at exterior level
        shape.lineTo(halfW, -t);           // Back to panel exterior
      } else {
        shape.lineTo(halfW, -t);
      }
      
      // Close along exterior
      shape.lineTo(-halfW, -t);
    } else {
      // For side walls: flanges extend toward -Z (exterior)
      // This makes them wrap around the front/back wall panels from outside
      
      // Start at interior face, left edge
      shape.moveTo(-halfW, 0);
      
      // Left flange going toward exterior (-Z)
      if (leftF > 0) {
        shape.lineTo(-halfW, -leftF - t);  // Flange extends outward
        shape.lineTo(-halfW + t, -leftF - t); // Outer edge of flange
        shape.lineTo(-halfW + t, -t);      // Back toward panel
        shape.lineTo(-halfW, -t);          // Panel exterior face
      } else {
        shape.lineTo(-halfW, -t);
      }
      
      // Exterior face
      shape.lineTo(halfW, -t);
      
      // Right flange going toward exterior (-Z)
      if (rightF > 0) {
        shape.lineTo(halfW, -rightF - t);  // Flange extends outward
        shape.lineTo(halfW - t, -rightF - t); // Outer edge of flange
        shape.lineTo(halfW - t, 0);        // Back to interior level
        shape.lineTo(halfW, 0);            // Panel interior face
      } else {
        shape.lineTo(halfW, 0);
      }
      
      // Close along interior
      shape.lineTo(-halfW, 0);
    }

    // Extrude upward for wall height
    const extrudeSettings = {
      steps: 1,
      depth: h,
      bevelEnabled: false,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Rotate to stand upright (extrusion was along Z, needs to be +Y)
    geo.rotateX(-Math.PI / 2);
    
    return geo;
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
