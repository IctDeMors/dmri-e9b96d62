import { useMemo } from "react";
import type { BathroomConfig, WallPanel } from "./types";
import { WallPanels } from "./WallPanel3D";

interface BathroomWallsProps {
  config: BathroomConfig;
}

// Scale: 1000mm = 1 unit
const SCALE = 1 / 1000;
const PANEL_THICKNESS = 19; // 19mm panel thickness
const DEFAULT_FLANGE_WIDTH = 100; // Default flange width in mm

/**
 * Generates wall panels for the bathroom based on configuration.
 * Panels have 19mm thickness with configurable flanges:
 * - __| (right flange)
 * - |__| (both flanges)
 * - |__ (left flange)
 */
export const BathroomWalls = ({ config }: BathroomWallsProps) => {
  const { dimensions, floorShape, lShapeConfig } = config;
  
  const wallPanels = useMemo<WallPanel[]>(() => {
    const w = dimensions.width;
    const d = dimensions.depth;
    const h = dimensions.height;
    const panels: WallPanel[] = [];
    
    if (floorShape === "rectangle") {
      // Back wall - full width panel with flanges on both ends
      // Panel positioned at back, facing forward
      panels.push({
        id: "back-wall",
        x: 0,
        z: -d / 2 + PANEL_THICKNESS / 2,
        width: w - 2 * PANEL_THICKNESS, // Account for corner flanges
        height: h,
        rotation: 0,
        flange: {
          type: "both",
          leftWidth: DEFAULT_FLANGE_WIDTH,
          rightWidth: DEFAULT_FLANGE_WIDTH,
        },
      });
      
      // Left wall - panel with flange at back corner
      // Rotated 90 degrees, flange connects to back wall
      panels.push({
        id: "left-wall",
        x: -w / 2 + PANEL_THICKNESS / 2,
        z: 0,
        width: d - PANEL_THICKNESS,
        height: h,
        rotation: 90,
        flange: {
          type: "right", // Right side flange (at back when rotated)
          leftWidth: 0,
          rightWidth: DEFAULT_FLANGE_WIDTH,
        },
      });
      
      // Right wall - panel with flange at back corner
      // Rotated -90 degrees, flange connects to back wall
      panels.push({
        id: "right-wall",
        x: w / 2 - PANEL_THICKNESS / 2,
        z: 0,
        width: d - PANEL_THICKNESS,
        height: h,
        rotation: -90,
        flange: {
          type: "right", // Right side flange (at back when rotated)
          leftWidth: 0,
          rightWidth: DEFAULT_FLANGE_WIDTH,
        },
      });
    } else if (floorShape === "l-shape" && lShapeConfig) {
      const cutW = lShapeConfig.cutoutWidth;
      const cutD = lShapeConfig.cutoutDepth;
      
      switch (lShapeConfig.cutoutCorner) {
        case "top-right":
          // Back wall left section with both flanges
          panels.push({
            id: "back-left",
            x: -(cutW / 2),
            z: -d / 2 + PANEL_THICKNESS / 2,
            width: w - cutW - PANEL_THICKNESS,
            height: h,
            rotation: 0,
            flange: {
              type: "both",
              leftWidth: DEFAULT_FLANGE_WIDTH,
              rightWidth: DEFAULT_FLANGE_WIDTH,
            },
          });
          
          // Inner back wall (after cutout) with right flange
          panels.push({
            id: "back-inner",
            x: w / 2 - cutW / 2,
            z: -d / 2 + cutD + PANEL_THICKNESS / 2,
            width: cutW - PANEL_THICKNESS,
            height: h,
            rotation: 0,
            flange: {
              type: "left",
              leftWidth: DEFAULT_FLANGE_WIDTH,
              rightWidth: 0,
            },
          });
          
          // Left wall - full depth with back flange
          panels.push({
            id: "left-wall",
            x: -w / 2 + PANEL_THICKNESS / 2,
            z: 0,
            width: d - PANEL_THICKNESS,
            height: h,
            rotation: 90,
            flange: {
              type: "right",
              leftWidth: 0,
              rightWidth: DEFAULT_FLANGE_WIDTH,
            },
          });
          
          // Right wall - partial, below cutout
          panels.push({
            id: "right-wall",
            x: w / 2 - PANEL_THICKNESS / 2,
            z: cutD / 2,
            width: d - cutD - PANEL_THICKNESS,
            height: h,
            rotation: -90,
            flange: {
              type: "right",
              leftWidth: 0,
              rightWidth: DEFAULT_FLANGE_WIDTH,
            },
          });
          
          // Inner horizontal wall (cutout edge)
          panels.push({
            id: "inner-horizontal",
            x: w / 2 - cutW / 2,
            z: -d / 2 + cutD - PANEL_THICKNESS / 2,
            width: cutW,
            height: h,
            rotation: 180,
            flange: {
              type: "right",
              leftWidth: 0,
              rightWidth: DEFAULT_FLANGE_WIDTH,
            },
          });
          break;
          
        default:
          // Fallback to simple rectangle walls
          panels.push({
            id: "back-wall",
            x: 0,
            z: -d / 2 + PANEL_THICKNESS / 2,
            width: w - 2 * PANEL_THICKNESS,
            height: h,
            rotation: 0,
            flange: {
              type: "both",
              leftWidth: DEFAULT_FLANGE_WIDTH,
              rightWidth: DEFAULT_FLANGE_WIDTH,
            },
          });
          
          panels.push({
            id: "left-wall",
            x: -w / 2 + PANEL_THICKNESS / 2,
            z: 0,
            width: d - PANEL_THICKNESS,
            height: h,
            rotation: 90,
            flange: {
              type: "right",
              leftWidth: 0,
              rightWidth: DEFAULT_FLANGE_WIDTH,
            },
          });
          
          panels.push({
            id: "right-wall",
            x: w / 2 - PANEL_THICKNESS / 2,
            z: 0,
            width: d - PANEL_THICKNESS,
            height: h,
            rotation: -90,
            flange: {
              type: "right",
              leftWidth: 0,
              rightWidth: DEFAULT_FLANGE_WIDTH,
            },
          });
      }
    }
    
    return panels;
  }, [dimensions, floorShape, lShapeConfig]);

  return <WallPanels panels={wallPanels} />;
};
