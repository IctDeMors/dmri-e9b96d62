import { useMemo } from "react";
import type { BathroomConfig, WallPanel, FlangeConfig } from "./types";
import { WallPanels } from "./WallPanel3D";

interface BathroomWallsProps {
  config: BathroomConfig;
}

// Constants
const PANEL_THICKNESS = 19; // 19mm panel thickness
const MAX_PANEL_WIDTH = 900; // Maximum panel width in mm
const MIN_PANEL_WIDTH = 170; // Minimum panel width in mm
const DEFAULT_FLANGE_WIDTH = 100; // Default flange width in mm

/**
 * Divides a wall length into panels of max 900mm with a filler strip
 * Strategy: Use as many 900mm panels as possible, fill remainder with passtrook
 */
function divideWallIntoPanels(
  totalLength: number,
  wallId: string,
  startX: number,
  z: number,
  height: number,
  rotation: number,
  hasLeftFlange: boolean,
  hasRightFlange: boolean
): WallPanel[] {
  const panels: WallPanel[] = [];
  
  // Calculate usable length (accounting for flanges at ends)
  const leftFlangeOffset = hasLeftFlange ? PANEL_THICKNESS : 0;
  const rightFlangeOffset = hasRightFlange ? PANEL_THICKNESS : 0;
  const usableLength = totalLength - leftFlangeOffset - rightFlangeOffset;
  
  if (usableLength <= 0) return panels;
  
  // Calculate number of full 900mm panels
  const numFullPanels = Math.floor(usableLength / MAX_PANEL_WIDTH);
  const remainder = usableLength - (numFullPanels * MAX_PANEL_WIDTH);
  
  let currentX = startX + leftFlangeOffset;
  
  // Create full panels
  for (let i = 0; i < numFullPanels; i++) {
    const isFirst = i === 0;
    const isLast = i === numFullPanels - 1 && remainder < MIN_PANEL_WIDTH;
    
    const flange: FlangeConfig = {
      type: isFirst && hasLeftFlange 
        ? (isLast && hasRightFlange ? "both" : "left")
        : (isLast && hasRightFlange ? "right" : "none"),
      leftWidth: isFirst && hasLeftFlange ? DEFAULT_FLANGE_WIDTH : 0,
      rightWidth: isLast && hasRightFlange ? DEFAULT_FLANGE_WIDTH : 0,
    };
    
    panels.push({
      id: `${wallId}-panel-${i}`,
      x: currentX + MAX_PANEL_WIDTH / 2,
      z,
      width: MAX_PANEL_WIDTH,
      height,
      rotation,
      flange,
    });
    
    currentX += MAX_PANEL_WIDTH;
  }
  
  // Create filler panel (passtrook) if needed
  if (remainder >= MIN_PANEL_WIDTH) {
    const isFirst = numFullPanels === 0;
    const flange: FlangeConfig = {
      type: isFirst && hasLeftFlange 
        ? (hasRightFlange ? "both" : "left")
        : (hasRightFlange ? "right" : "none"),
      leftWidth: isFirst && hasLeftFlange ? DEFAULT_FLANGE_WIDTH : 0,
      rightWidth: hasRightFlange ? DEFAULT_FLANGE_WIDTH : 0,
    };
    
    panels.push({
      id: `${wallId}-filler`,
      x: currentX + remainder / 2,
      z,
      width: remainder,
      height,
      rotation,
      flange,
    });
  } else if (remainder > 0 && numFullPanels > 0) {
    // Add remainder to the last panel
    const lastPanel = panels[panels.length - 1];
    lastPanel.width += remainder;
    lastPanel.x += remainder / 2;
  }
  
  return panels;
}

/**
 * Generates wall panels for the bathroom based on configuration.
 * Panels have 19mm thickness with configurable flanges pointing OUTWARD.
 * Walls are divided into max 900mm panels with filler strips.
 */
export const BathroomWalls = ({ config }: BathroomWallsProps) => {
  const { dimensions, floorShape, lShapeConfig } = config;
  
  const wallPanels = useMemo<WallPanel[]>(() => {
    const w = dimensions.width;
    const d = dimensions.depth;
    const h = dimensions.height;
    const panels: WallPanel[] = [];
    
    if (floorShape === "rectangle") {
      // Back wall - facing +Z (into bathroom)
      // Position at back of bathroom, panels face forward
      const backPanels = divideWallIntoPanels(
        w,
        "back",
        -w / 2,
        -d / 2,
        h,
        0,
        true,  // left flange (connects to left wall)
        true   // right flange (connects to right wall)
      );
      panels.push(...backPanels);
      
      // Left wall - rotated 90°, facing +X (into bathroom)
      const leftPanels = divideWallIntoPanels(
        d,
        "left",
        -d / 2,
        0,
        h,
        90,
        true,  // left flange (at back)
        false  // no right flange (front is open)
      );
      // Adjust positions for left wall (swap x/z due to rotation)
      leftPanels.forEach(p => {
        const originalX = p.x;
        p.x = -w / 2;
        p.z = originalX;
      });
      panels.push(...leftPanels);
      
      // Right wall - rotated -90°, facing -X (into bathroom)
      const rightPanels = divideWallIntoPanels(
        d,
        "right",
        -d / 2,
        0,
        h,
        -90,
        true,  // left flange (at back)
        false  // no right flange (front is open)
      );
      // Adjust positions for right wall
      rightPanels.forEach(p => {
        const originalX = p.x;
        p.x = w / 2;
        p.z = originalX;
      });
      panels.push(...rightPanels);
      
    } else if (floorShape === "l-shape" && lShapeConfig) {
      const cutW = lShapeConfig.cutoutWidth;
      const cutD = lShapeConfig.cutoutDepth;
      
      // L-shape with top-right cutout
      if (lShapeConfig.cutoutCorner === "top-right") {
        // Back wall left section
        const backLeftPanels = divideWallIntoPanels(
          w - cutW,
          "back-left",
          -w / 2,
          -d / 2,
          h,
          0,
          true,
          true
        );
        panels.push(...backLeftPanels);
        
        // Inner back wall (after cutout)
        const backInnerPanels = divideWallIntoPanels(
          cutW,
          "back-inner",
          w / 2 - cutW,
          -d / 2 + cutD,
          h,
          0,
          true,
          true
        );
        panels.push(...backInnerPanels);
        
        // Left wall - full depth
        const leftPanels = divideWallIntoPanels(
          d,
          "left",
          -d / 2,
          0,
          h,
          90,
          true,
          false
        );
        leftPanels.forEach(p => {
          const originalX = p.x;
          p.x = -w / 2;
          p.z = originalX;
        });
        panels.push(...leftPanels);
        
        // Right wall - partial (from front to cutout)
        const rightPanels = divideWallIntoPanels(
          d - cutD,
          "right",
          cutD - d / 2,
          0,
          h,
          -90,
          true,
          false
        );
        rightPanels.forEach(p => {
          const originalX = p.x;
          p.x = w / 2;
          p.z = originalX + cutD / 2;
        });
        panels.push(...rightPanels);
        
        // Inner horizontal wall at cutout
        const innerHPanels = divideWallIntoPanels(
          cutW,
          "inner-h",
          w / 2 - cutW,
          -d / 2 + cutD,
          h,
          180,
          true,
          true
        );
        panels.push(...innerHPanels);
      }
    }
    
    return panels;
  }, [dimensions, floorShape, lShapeConfig]);

  return <WallPanels panels={wallPanels} />;
};
