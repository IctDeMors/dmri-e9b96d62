import { useMemo } from "react";
import type { BathroomConfig, WallPanel, FlangeConfig, DoorConfig } from "./types";
import { WallPanels } from "./WallPanel3D";

interface BathroomWallsProps {
  config: BathroomConfig;
}

// Constants based on specifications
const PANEL_THICKNESS = 19; // 19mm panel thickness
const MAX_PANEL_WIDTH = 900; // Maximum panel width in mm (gebogen)
const MIN_PANEL_WIDTH = 170; // Minimum panel width in mm (ongebogen)
const DEFAULT_FLANGE_WIDTH = 100; // Default flange width in mm
const DOOR_FLANGE_WIDTH = 55; // Flange width at door frame (55 or 85mm per spec)

/**
 * Creates a single wall panel with specified configuration.
 */
function createPanel(
  id: string,
  centerX: number,
  posZ: number,
  width: number,
  height: number,
  rotation: number,
  flangeType: FlangeConfig["type"],
  leftFlangeWidth: number = DEFAULT_FLANGE_WIDTH,
  rightFlangeWidth: number = DEFAULT_FLANGE_WIDTH,
  flipFlanges: boolean = false
): WallPanel {
  return {
    id,
    x: centerX,
    z: posZ,
    width,
    height,
    rotation,
    flange: {
      type: flangeType,
      leftWidth: flangeType === "left" || flangeType === "both" ? leftFlangeWidth : 0,
      rightWidth: flangeType === "right" || flangeType === "both" ? rightFlangeWidth : 0,
    },
    flipFlanges,
  };
}

/**
 * Creates back wall panels with specific layout:
 * - Left panel: 900mm with left corner flange
 * - Middle panel: remaining width (passtrook)
 * - Right panel: 900mm with right corner flange
 */
function createBackWallPanels(
  wallId: string,
  wallLength: number,
  wallHeight: number,
  startX: number,
  posZ: number,
  rotation: number
): WallPanel[] {
  const panels: WallPanel[] = [];
  
  // Fixed widths for left and right panels
  const sideWidth = MAX_PANEL_WIDTH; // 900mm
  const middleWidth = wallLength - (2 * sideWidth);
  
  if (wallLength <= 2 * sideWidth) {
    // Wall too short for 3 panels, use 2 panels
    if (wallLength <= sideWidth) {
      // Single panel
      panels.push(createPanel(
        `${wallId}-0`,
        startX + wallLength / 2,
        posZ,
        wallLength,
        wallHeight,
        rotation,
        "both",
        DEFAULT_FLANGE_WIDTH,
        DEFAULT_FLANGE_WIDTH,
        true  // flipFlanges for back wall
      ));
    } else {
      // Two panels
      const halfWidth = wallLength / 2;
      panels.push(createPanel(
        `${wallId}-left`,
        startX + halfWidth / 2,
        posZ,
        halfWidth,
        wallHeight,
        rotation,
        "left",
        DEFAULT_FLANGE_WIDTH,
        DEFAULT_FLANGE_WIDTH,
        true  // flipFlanges for back wall
      ));
      panels.push(createPanel(
        `${wallId}-right`,
        startX + halfWidth + halfWidth / 2,
        posZ,
        halfWidth,
        wallHeight,
        rotation,
        "right",
        DEFAULT_FLANGE_WIDTH,
        DEFAULT_FLANGE_WIDTH,
        true  // flipFlanges for back wall
      ));
    }
  } else {
    // Three panels: left 900mm, middle passtrook, right 900mm
    // Left panel with corner flange
    panels.push(createPanel(
      `${wallId}-left`,
      startX + sideWidth / 2,
      posZ,
      sideWidth,
      wallHeight,
      rotation,
      "left",
      DEFAULT_FLANGE_WIDTH,
      DEFAULT_FLANGE_WIDTH,
      true  // flipFlanges for back wall
    ));
    
    // Middle panel (passtrook) - no flanges, butts against adjacent panels
    panels.push(createPanel(
      `${wallId}-middle`,
      startX + sideWidth + middleWidth / 2,
      posZ,
      middleWidth,
      wallHeight,
      rotation,
      "none",
      DEFAULT_FLANGE_WIDTH,
      DEFAULT_FLANGE_WIDTH,
      true  // flipFlanges for back wall
    ));
    
    // Right panel with corner flange
    panels.push(createPanel(
      `${wallId}-right`,
      startX + sideWidth + middleWidth + sideWidth / 2,
      posZ,
      sideWidth,
      wallHeight,
      rotation,
      "right",
      DEFAULT_FLANGE_WIDTH,
      DEFAULT_FLANGE_WIDTH,
      true  // flipFlanges for back wall
    ));
  }
  
  return panels;
}

/**
 * Divides a wall segment into panels.
 * Uses max 900mm panels and fills remainder with a passtrook (filler strip).
 */
function createWallPanels(
  wallId: string,
  wallLength: number,
  wallHeight: number,
  startX: number,
  posZ: number,
  rotation: number,
  startFlange: boolean,
  endFlange: boolean,
  flangeWidth: number = DEFAULT_FLANGE_WIDTH,
  endFlangeWidth: number = flangeWidth,
  flipFlanges: boolean = false
): WallPanel[] {
  const panels: WallPanel[] = [];
  
  if (wallLength <= 0) return panels;
  
  // Calculate how many full panels and remainder
  const numFullPanels = Math.floor(wallLength / MAX_PANEL_WIDTH);
  const remainder = wallLength % MAX_PANEL_WIDTH;
  
  // Determine panel distribution
  let panelWidths: number[] = [];
  
  if (numFullPanels === 0) {
    panelWidths = [wallLength];
  } else if (remainder === 0) {
    panelWidths = Array(numFullPanels).fill(MAX_PANEL_WIDTH);
  } else if (remainder >= MIN_PANEL_WIDTH) {
    panelWidths = [...Array(numFullPanels).fill(MAX_PANEL_WIDTH), remainder];
  } else {
    const adjustedWidth = wallLength / numFullPanels;
    panelWidths = Array(numFullPanels).fill(adjustedWidth);
  }
  
  let currentX = startX;
  
  panelWidths.forEach((width, index) => {
    const isFirst = index === 0;
    const isLast = index === panelWidths.length - 1;
    
    const hasLeftFlange = isFirst && startFlange;
    const hasRightFlange = isLast && endFlange;
    
    const flangeType: FlangeConfig["type"] = 
      hasLeftFlange && hasRightFlange ? "both" :
      hasLeftFlange ? "left" :
      hasRightFlange ? "right" : "none";
    
    const flange: FlangeConfig = {
      type: flangeType,
      leftWidth: hasLeftFlange ? flangeWidth : 0,
      rightWidth: hasRightFlange ? endFlangeWidth : 0,
    };
    
    const panelCenterX = currentX + width / 2;
    
    panels.push({
      id: `${wallId}-${index}`,
      x: panelCenterX,
      z: posZ,
      width: width,
      height: wallHeight,
      rotation: rotation,
      flange,
      flipFlanges,
    });
    
    currentX += width;
  });
  
  return panels;
}

/**
 * Creates front wall panels with door opening.
 * The door creates a gap, so we have panels on left and right of door.
 */
function createFrontWallWithDoor(
  wallLength: number,
  wallHeight: number,
  startX: number,
  posZ: number,
  rotation: number,
  doorConfig: DoorConfig,
  leftCornerFlange: boolean,
  rightCornerFlange: boolean
): WallPanel[] {
  const allPanels: WallPanel[] = [];
  
  // Calculate segments: left of door, door opening, right of door
  const leftSegmentWidth = doorConfig.position;
  const rightSegmentStart = doorConfig.position + doorConfig.width;
  const rightSegmentWidth = wallLength - rightSegmentStart;
  
  // Left segment (from left corner to door)
  if (leftSegmentWidth > 0) {
    const leftPanels = createWallPanels(
      "front-left",
      leftSegmentWidth,
      wallHeight,
      startX,
      posZ,
      rotation,
      leftCornerFlange,  // corner flange on left
      true,              // door frame flange on right
      DEFAULT_FLANGE_WIDTH,
      DOOR_FLANGE_WIDTH,  // door frame uses 55mm flange
      true  // flipFlanges for front wall
    );
    allPanels.push(...leftPanels);
  }
  
  // Right segment (from door to right corner)
  if (rightSegmentWidth > 0) {
    const rightPanels = createWallPanels(
      "front-right",
      rightSegmentWidth,
      wallHeight,
      startX + rightSegmentStart,
      posZ,
      rotation,
      true,               // door frame flange on left
      rightCornerFlange,  // corner flange on right
      DOOR_FLANGE_WIDTH,  // door frame uses 55mm flange
      DEFAULT_FLANGE_WIDTH,
      true  // flipFlanges for front wall
    );
    allPanels.push(...rightPanels);
  }
  
  return allPanels;
}

/**
 * Transforms panel positions for walls running along Z axis.
 */
function transformPanelsForOrientation(
  panels: WallPanel[],
  wallOrientation: "x" | "z",
  wallPosition: number
): WallPanel[] {
  if (wallOrientation === "x") {
    return panels.map(p => ({ ...p, z: wallPosition }));
  } else {
    return panels.map(p => ({
      ...p,
      x: wallPosition,
      z: p.x,
    }));
  }
}

export const BathroomWalls = ({ config }: BathroomWallsProps) => {
  const { dimensions, floorShape, lShapeConfig, doorConfig } = config;
  
  const wallPanels = useMemo<WallPanel[]>(() => {
    const w = dimensions.width;
    const d = dimensions.depth;
    const h = dimensions.height;
    const allPanels: WallPanel[] = [];
    
    if (floorShape === "rectangle") {
      // BACK WALL - 3 panels: left 900mm, middle passtrook, right 900mm
      const backPanels = createBackWallPanels(
        "back",
        w,
        h,
        -w / 2,
        -d / 2,
        0
      );
      allPanels.push(...backPanels);
      
      // LEFT WALL - full depth from back to front
      const leftPanels = createWallPanels(
        "left",
        d,
        h,
        -d / 2,
        0,
        -90,
        true,   // back corner flange
        true,   // front corner flange
        DEFAULT_FLANGE_WIDTH
      );
      allPanels.push(...transformPanelsForOrientation(leftPanels, "z", -w / 2));
      
      // RIGHT WALL - full depth from back to front
      const rightPanels = createWallPanels(
        "right",
        d,
        h,
        -d / 2,
        0,
        90,
        true,   // back corner flange
        true,   // front corner flange
        DEFAULT_FLANGE_WIDTH
      );
      allPanels.push(...transformPanelsForOrientation(rightPanels, "z", w / 2));
      
      // FRONT WALL - with door opening
      const frontPanels = createFrontWallWithDoor(
        w,
        h,
        -w / 2,
        d / 2,
        180,    // faces inward (-Z direction)
        doorConfig,
        true,   // left corner flange
        true    // right corner flange
      );
      allPanels.push(...frontPanels);
      
    } else if (floorShape === "l-shape" && lShapeConfig) {
      const cutW = lShapeConfig.cutoutWidth;
      const cutD = lShapeConfig.cutoutDepth;
      
      if (lShapeConfig.cutoutCorner === "top-right") {
        // Back wall - left section
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
        
        // Inner back wall
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
          true,
          DEFAULT_FLANGE_WIDTH
        );
        allPanels.push(...transformPanelsForOrientation(leftPanels, "z", -w / 2));
        
        // Right wall - partial
        const rightPanels = createWallPanels(
          "right",
          d - cutD,
          h,
          -d / 2 + cutD,
          0,
          90,
          true,
          true,
          DEFAULT_FLANGE_WIDTH
        );
        allPanels.push(...transformPanelsForOrientation(rightPanels, "z", w / 2));
        
        // Inner vertical wall at cutout
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
        
        // Front wall with door
        const frontPanels = createFrontWallWithDoor(
          w,
          h,
          -w / 2,
          d / 2,
          180,
          doorConfig,
          true,
          true
        );
        allPanels.push(...frontPanels);
      }
    }
    
    return allPanels;
  }, [dimensions, floorShape, lShapeConfig, doorConfig]);

  return <WallPanels panels={wallPanels} />;
};
