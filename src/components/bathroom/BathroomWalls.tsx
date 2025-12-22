import { useMemo } from "react";
import type { BathroomConfig, WallPanel, FlangeConfig } from "./types";
import { WallPanels } from "./WallPanel3D";

interface BathroomWallsProps {
  config: BathroomConfig;
}

// Constants based on specifications
const PANEL_THICKNESS = 19; // 19mm panel thickness
const MAX_PANEL_WIDTH = 900; // Maximum panel width in mm (gebogen)
const MIN_PANEL_WIDTH = 170; // Minimum panel width in mm (ongebogen)
const DEFAULT_FLANGE_WIDTH = 100; // Default flange width in mm
const MAX_FLANGE_WIDTH = 150; // Maximum flange width in mm

/**
 * Divides a wall segment into panels.
 * Uses max 900mm panels and fills remainder with a passtrook (filler strip).
 * Flanges are at panel edges, folding outward.
 */
function createWallPanels(
  wallId: string,
  wallLength: number,
  wallHeight: number,
  // Start position of wall segment
  startX: number,
  posZ: number,
  rotation: number,
  // Which ends need flanges for corner connections
  startFlange: boolean,
  endFlange: boolean,
  flangeWidth: number = DEFAULT_FLANGE_WIDTH
): WallPanel[] {
  const panels: WallPanel[] = [];
  
  if (wallLength <= 0) return panels;
  
  // Calculate how many full panels and remainder
  const numFullPanels = Math.floor(wallLength / MAX_PANEL_WIDTH);
  const remainder = wallLength % MAX_PANEL_WIDTH;
  
  // Determine panel distribution
  let panelWidths: number[] = [];
  
  if (numFullPanels === 0) {
    // Wall is shorter than max panel width
    panelWidths = [wallLength];
  } else if (remainder === 0) {
    // Perfect fit with full panels
    panelWidths = Array(numFullPanels).fill(MAX_PANEL_WIDTH);
  } else if (remainder >= MIN_PANEL_WIDTH) {
    // Full panels + filler strip
    panelWidths = [...Array(numFullPanels).fill(MAX_PANEL_WIDTH), remainder];
  } else {
    // Remainder too small, distribute across panels
    // Take some width from last full panel to make filler viable
    const adjustedWidth = (wallLength) / (numFullPanels);
    panelWidths = Array(numFullPanels).fill(adjustedWidth);
  }
  
  // Create panels
  let currentX = startX;
  
  panelWidths.forEach((width, index) => {
    const isFirst = index === 0;
    const isLast = index === panelWidths.length - 1;
    
    // Determine flange configuration
    // Each panel can have flanges on left, right, both, or none
    const hasLeftFlange = isFirst && startFlange;
    const hasRightFlange = isLast && endFlange;
    
    const flangeType: FlangeConfig["type"] = 
      hasLeftFlange && hasRightFlange ? "both" :
      hasLeftFlange ? "left" :
      hasRightFlange ? "right" : "none";
    
    const flange: FlangeConfig = {
      type: flangeType,
      leftWidth: hasLeftFlange ? flangeWidth : 0,
      rightWidth: hasRightFlange ? flangeWidth : 0,
    };
    
    // Panel position is at center of panel width
    const panelCenterX = currentX + width / 2;
    
    panels.push({
      id: `${wallId}-${index}`,
      x: panelCenterX,
      z: posZ,
      width: width,
      height: wallHeight,
      rotation: rotation,
      flange,
    });
    
    currentX += width;
  });
  
  return panels;
}

/**
 * Transforms panel positions based on wall orientation.
 * Panels are created assuming wall runs along X axis.
 * This function repositions them for walls running along Z axis.
 */
function transformPanelsForOrientation(
  panels: WallPanel[],
  wallOrientation: "x" | "z",
  wallPosition: number
): WallPanel[] {
  if (wallOrientation === "x") {
    // Wall runs along X axis, panels are correct, just set Z position
    return panels.map(p => ({ ...p, z: wallPosition }));
  } else {
    // Wall runs along Z axis, swap X and Z coordinates
    return panels.map(p => ({
      ...p,
      x: wallPosition,
      z: p.x, // Original X becomes Z position
    }));
  }
}

export const BathroomWalls = ({ config }: BathroomWallsProps) => {
  const { dimensions, floorShape, lShapeConfig } = config;
  
  const wallPanels = useMemo<WallPanel[]>(() => {
    const w = dimensions.width;
    const d = dimensions.depth;
    const h = dimensions.height;
    const allPanels: WallPanel[] = [];
    
    if (floorShape === "rectangle") {
      // BACK WALL - runs along X axis at back of bathroom
      // Faces toward +Z (into bathroom), flanges go toward -Z (outside)
      const backPanels = createWallPanels(
        "back",
        w,
        h,
        -w / 2,  // start at left edge
        -d / 2,  // at back of bathroom
        0,       // no rotation, faces +Z
        true,    // left corner flange
        true,    // right corner flange
        DEFAULT_FLANGE_WIDTH
      );
      allPanels.push(...backPanels);
      
      // LEFT WALL - runs along Z axis on left side
      // Faces toward +X (into bathroom), flanges go toward -X (outside)
      const leftPanels = createWallPanels(
        "left",
        d,
        h,
        -d / 2,  // start at back
        0,       // temporary Z, will be transformed
        -90,     // rotated to face +X
        true,    // back corner flange
        false,   // front is open (no door/entrance flange for now)
        DEFAULT_FLANGE_WIDTH
      );
      const transformedLeftPanels = transformPanelsForOrientation(leftPanels, "z", -w / 2);
      allPanels.push(...transformedLeftPanels);
      
      // RIGHT WALL - runs along Z axis on right side
      // Faces toward -X (into bathroom), flanges go toward +X (outside)
      const rightPanels = createWallPanels(
        "right",
        d,
        h,
        -d / 2,  // start at back
        0,       // temporary Z, will be transformed
        90,      // rotated to face -X
        true,    // back corner flange
        false,   // front is open
        DEFAULT_FLANGE_WIDTH
      );
      const transformedRightPanels = transformPanelsForOrientation(rightPanels, "z", w / 2);
      allPanels.push(...transformedRightPanels);
      
    } else if (floorShape === "l-shape" && lShapeConfig) {
      // L-shape configuration
      const cutW = lShapeConfig.cutoutWidth;
      const cutD = lShapeConfig.cutoutDepth;
      
      if (lShapeConfig.cutoutCorner === "top-right") {
        // Back wall - left section (from left edge to cutout)
        const backLeftPanels = createWallPanels(
          "back-left",
          w - cutW,
          h,
          -w / 2,
          -d / 2,
          0,
          true,
          true,
          DEFAULT_FLANGE_WIDTH
        );
        allPanels.push(...backLeftPanels);
        
        // Inner back wall - section after cutout
        const backInnerPanels = createWallPanels(
          "back-inner",
          cutW,
          h,
          w / 2 - cutW,
          -d / 2 + cutD,
          0,
          true,
          true,
          DEFAULT_FLANGE_WIDTH
        );
        allPanels.push(...backInnerPanels);
        
        // Left wall - full depth
        const leftPanels = createWallPanels(
          "left",
          d,
          h,
          -d / 2,
          0,
          -90,
          true,
          false,
          DEFAULT_FLANGE_WIDTH
        );
        allPanels.push(...transformPanelsForOrientation(leftPanels, "z", -w / 2));
        
        // Right wall - partial (from cutout to front)
        const rightPanels = createWallPanels(
          "right",
          d - cutD,
          h,
          -d / 2 + cutD,
          0,
          90,
          true,
          false,
          DEFAULT_FLANGE_WIDTH
        );
        allPanels.push(...transformPanelsForOrientation(rightPanels, "z", w / 2));
        
        // Inner vertical wall at cutout (runs along Z)
        const innerVertPanels = createWallPanels(
          "inner-vert",
          cutD,
          h,
          -d / 2,
          0,
          90,
          true,
          true,
          DEFAULT_FLANGE_WIDTH
        );
        allPanels.push(...transformPanelsForOrientation(innerVertPanels, "z", w / 2 - cutW));
      }
    }
    
    return allPanels;
  }, [dimensions, floorShape, lShapeConfig]);

  return <WallPanels panels={wallPanels} />;
};
