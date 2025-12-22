// Types for 3D Bathroom Configurator

export type FloorShape = "rectangle" | "l-shape";

export type SanitaryType = "shower" | "toilet" | "vanity";

export interface Position {
  x: number;
  z: number;
}

export interface Dimensions {
  width: number;  // breedte in mm
  depth: number;  // diepte in mm
  height: number; // hoogte in mm (default 2400)
}

export interface SanitaryItem {
  id: string;
  type: SanitaryType;
  position: Position;
  rotation: number; // in degrees
}

export interface PartitionWall {
  id: string;
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  height: number;
}

export interface LShapeConfig {
  // Main rectangle dimensions
  mainWidth: number;
  mainDepth: number;
  // Cutout dimensions (for L-shape)
  cutoutWidth: number;
  cutoutDepth: number;
  // Corner position of cutout
  cutoutCorner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export interface BathroomConfig {
  floorShape: FloorShape;
  dimensions: Dimensions;
  lShapeConfig?: LShapeConfig;
  sanitaryItems: SanitaryItem[];
  partitionWalls: PartitionWall[];
  showGrid: boolean;
}

export const SANITARY_DIMENSIONS: Record<SanitaryType, { width: number; depth: number; height: number }> = {
  shower: { width: 900, depth: 900, height: 2100 },
  toilet: { width: 400, depth: 600, height: 450 },
  vanity: { width: 800, depth: 500, height: 850 },
};

export const SANITARY_COLORS: Record<SanitaryType, string> = {
  shower: "#87CEEB",
  toilet: "#FFFFFF",
  vanity: "#8B4513",
};

export const DEFAULT_BATHROOM_CONFIG: BathroomConfig = {
  floorShape: "rectangle",
  dimensions: {
    width: 2400,
    depth: 1800,
    height: 2400,
  },
  sanitaryItems: [],
  partitionWalls: [],
  showGrid: true,
};
