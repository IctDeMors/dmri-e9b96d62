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
 * Creates back wall panels using the standard element pattern:
 * - First panel: "Wand Flens rechts" (corner flange left, connection flange right)
 * - Middle panels: "Wand Flens links en rechts" (connection flanges both sides)
 * - Last panel: "Wand Flens links" (connection flange left, corner flange right)
 * 
 * All flanges point OUTWARD (exterior) - interior is always smooth
 */
function createBackWallPanels(
  wallId: string,
  wallLength: number,
  wallHeight: number,
  startX: number,
  posZ: number,
  rotation: number
): WallPanel[] {
  // Use the standard createWallPanels with corner flanges on both ends
  // flipFlanges = false means flanges extend outward (exterior)
  return createWallPanels(
    wallId,
    wallLength,
    wallHeight,
    startX,
    posZ,
    rotation,
    true,   // startFlange (left corner)
    true,   // endFlange (right corner)
    DEFAULT_FLANGE_WIDTH,
    DEFAULT_FLANGE_WIDTH,
    false   // flipFlanges = false: flanges point OUTWARD, interior is smooth
  );
}

/**
 * Divides a wall segment into panels following the element pattern:
 * 
 * Viewing from INSIDE the bathroom:
 * - 1 panel: "Wand Flens links en rechts" (both flanges)
 * - 2 panels: Both panels as wide as possible, symmetrical
 *   - First: "Wand Flens rechts" (right flange for connection)
 *   - Last: "Wand Flens links" (left flange for connection)
 * - 3+ panels: Outer panels max width (symmetrical), middle panel(s) variable width
 *   - First: "Wand Flens rechts" (right flange)
 *   - Middle: "Wand Flens links en rechts" (both flanges, variable width)
 *   - Last: "Wand Flens links" (left flange)
 * 
 * Max panel width: 900mm
 * All flanges point OUTWARD - interior is always smooth
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
  flipFlanges: boolean = false,
  swapLeftRight: boolean = false  // Swap left/right flanges for mirrored walls
): WallPanel[] {
  const panels: WallPanel[] = [];
  
  if (wallLength <= 0) return panels;
  
  // Helper to create flange config with optional left/right swap
  const makeFlange = (
    type: FlangeConfig["type"],
    leftW: number,
    rightW: number
  ): { type: FlangeConfig["type"]; leftWidth: number; rightWidth: number } => {
    if (swapLeftRight) {
      // Swap left and right
      const swappedType = type === "left" ? "right" : type === "right" ? "left" : type;
      return { type: swappedType, leftWidth: rightW, rightWidth: leftW };
    }
    return { type, leftWidth: leftW, rightWidth: rightW };
  };
  
  // Calculate optimal panel distribution
  // Strategy: outer panels as wide as possible (up to MAX_PANEL_WIDTH), symmetrical
  // Middle panel(s) get the remaining width (variable)
  
  const numPanels = Math.ceil(wallLength / MAX_PANEL_WIDTH);
  
  if (numPanels === 1) {
    // Single panel - use full width, both flanges if applicable
    let flangeType: FlangeConfig["type"];
    let leftFlangeW = 0;
    let rightFlangeW = 0;
    
    if (startFlange && endFlange) {
      flangeType = "both";
      leftFlangeW = flangeWidth;
      rightFlangeW = endFlangeWidth;
    } else if (startFlange) {
      flangeType = "left";
      leftFlangeW = flangeWidth;
    } else if (endFlange) {
      flangeType = "right";
      rightFlangeW = endFlangeWidth;
    } else {
      flangeType = "none";
    }
    
    panels.push({
      id: `${wallId}-0`,
      x: startX + wallLength / 2,
      z: posZ,
      width: wallLength,
      height: wallHeight,
      rotation: rotation,
      flange: makeFlange(flangeType, leftFlangeW, rightFlangeW),
      flipFlanges,
    });
  } else if (numPanels === 2) {
    // Two panels - symmetrical, each half the wall length
    const panelWidth = wallLength / 2;
    
    // First panel: flens rechts (right flange for connection)
    panels.push({
      id: `${wallId}-0`,
      x: startX + panelWidth / 2,
      z: posZ,
      width: panelWidth,
      height: wallHeight,
      rotation: rotation,
      flange: makeFlange(
        startFlange ? "both" : "right",
        startFlange ? flangeWidth : 0,
        DEFAULT_FLANGE_WIDTH
      ),
      flipFlanges,
    });
    
    // Last panel: flens links (left flange for connection)
    panels.push({
      id: `${wallId}-1`,
      x: startX + panelWidth + panelWidth / 2,
      z: posZ,
      width: panelWidth,
      height: wallHeight,
      rotation: rotation,
      flange: makeFlange(
        endFlange ? "both" : "left",
        DEFAULT_FLANGE_WIDTH,
        endFlange ? endFlangeWidth : 0
      ),
      flipFlanges,
    });
  } else {
    // 3+ panels: outer panels max width (symmetrical), middle panel(s) variable
    // Calculate outer panel width (max 900mm, but symmetrical)
    const outerPanelWidth = Math.min(MAX_PANEL_WIDTH, wallLength / numPanels);
    const remainingWidth = wallLength - (2 * outerPanelWidth);
    const numMiddlePanels = numPanels - 2;
    const middlePanelWidth = remainingWidth / numMiddlePanels;
    
    let currentX = startX;
    
    // First panel: flens rechts (corner flange left if applicable, connection flange right)
    panels.push({
      id: `${wallId}-0`,
      x: currentX + outerPanelWidth / 2,
      z: posZ,
      width: outerPanelWidth,
      height: wallHeight,
      rotation: rotation,
      flange: makeFlange(
        startFlange ? "both" : "right",
        startFlange ? flangeWidth : 0,
        DEFAULT_FLANGE_WIDTH
      ),
      flipFlanges,
    });
    currentX += outerPanelWidth;
    
    // Middle panels: flens links en rechts (both flanges, variable width)
    for (let i = 0; i < numMiddlePanels; i++) {
      panels.push({
        id: `${wallId}-${i + 1}`,
        x: currentX + middlePanelWidth / 2,
        z: posZ,
        width: middlePanelWidth,
        height: wallHeight,
        rotation: rotation,
        flange: makeFlange("both", DEFAULT_FLANGE_WIDTH, DEFAULT_FLANGE_WIDTH),
        flipFlanges,
      });
      currentX += middlePanelWidth;
    }
    
    // Last panel: flens links (connection flange left, corner flange right if applicable)
    panels.push({
      id: `${wallId}-${numPanels - 1}`,
      x: currentX + outerPanelWidth / 2,
      z: posZ,
      width: outerPanelWidth,
      height: wallHeight,
      rotation: rotation,
      flange: makeFlange(
        endFlange ? "both" : "left",
        DEFAULT_FLANGE_WIDTH,
        endFlange ? endFlangeWidth : 0
      ),
      flipFlanges,
    });
  }
  
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
      false  // flipFlanges = false: flanges point OUTWARD
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
      false  // flipFlanges = false: flanges point OUTWARD
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
    
    // Panel thickness and flange width
    const t = PANEL_THICKNESS;
    const flangeW = DEFAULT_FLANGE_WIDTH;
    
    if (floorShape === "rectangle") {
      // Walls are positioned so that the FLANGES are flush with the floor edge
      // Flanges extend OUTWARD (exterior), so interior is smooth
      // Panel needs to be moved inward by flange width so flange tip aligns with floor edge
      // 
      // CORNER LOGIC: Side walls run the full depth, front/back walls fit INSIDE the side walls
      // This means front/back walls are (width - 2*thickness - 2*flangeWidth) wide
      
      const flangeW = DEFAULT_FLANGE_WIDTH;
      const innerWidth = w - 2 * t - 2 * flangeW;  // Width between side wall flanges
      
      // LEFT WALL - runs full depth, NO corner flanges at outer ends (back/front)
      // Due to -90° rotation and flipFlanges=true:
      // - "left" flange in panel = at startX = back (-d/2) -> should be OFF
      // - "right" flange in panel = at end = front (+d/2) -> should be OFF
      // SWAPPED: startFlange controls "left" (back), endFlange controls "right" (front)
      const sideWallLength = d;  // Full depth of floor
      const leftPanels = createWallPanels(
        "left",
        sideWallLength,
        h,
        -d / 2,
        0,
        -90,
        false,  // startFlange: no corner flange at start/back (-d/2)
        false,  // endFlange: no corner flange at end/front (+d/2)
        DEFAULT_FLANGE_WIDTH,
        DEFAULT_FLANGE_WIDTH,
        true    // flipFlanges=true: after -90° rotation, flanges point -X (outward)
      );
      // Flange tip flush with -w/2, panel center at -w/2 + flangeW + t/2
      allPanels.push(...transformPanelsForOrientation(leftPanels, "z", -w / 2 + flangeW + t / 2));
      
      // RIGHT WALL - mirrored from left wall, swap left/right flanges
      const rightPanels = createWallPanels(
        "right",
        sideWallLength,
        h,
        -d / 2,
        0,
        90,
        false,  // startFlange: no corner flange
        false,  // endFlange: no corner flange
        DEFAULT_FLANGE_WIDTH,
        DEFAULT_FLANGE_WIDTH,
        true,   // flipFlanges=true: flanges point +X (outward)
        true    // swapLeftRight=true: swap left/right flanges for mirrored wall
      );
      // Flange tip flush with w/2, panel center at w/2 - flangeW - t/2
      allPanels.push(...transformPanelsForOrientation(rightPanels, "z", w / 2 - flangeW - t / 2));
      
      // BACK WALL - fits INSIDE the side walls
      // Back wall spans between the inner faces of the side wall panels
      // Side wall panel center at: -w/2 + flangeW + t/2, inner face at: -w/2 + flangeW + t
      // Back wall panel must not overlap with side wall panels, so subtract panel thickness on both sides
      const backWallWidth = w - 2 * (flangeW + 2 * t);  // Width between side wall inner faces minus back wall thickness
      const backPanels = createWallPanels(
        "back",
        backWallWidth,
        h,
        -w / 2 + flangeW + 2 * t,  // Start after left side wall inner face + back wall panel thickness
        -d / 2 + flangeW + t / 2,  // Panel center so flange tip at -d/2
        0,
        true,   // left corner flange (connects to side wall inner face)
        true,   // right corner flange (connects to side wall inner face)
        DEFAULT_FLANGE_WIDTH,
        DEFAULT_FLANGE_WIDTH,
        false   // flanges point outward (-Z direction)
      );
      allPanels.push(...backPanels);
      
      // FRONT WALL - fits INSIDE the side walls, same width as back wall
      const frontPanels = createFrontWallWithDoor(
        backWallWidth,  // Same width as back wall
        h,
        -w / 2 + flangeW + 2 * t,  // Start after left side wall inner face + front wall panel thickness
        d / 2 - flangeW - t / 2,  // Panel center so flange tip at d/2
        180,
        doorConfig,
        true,   // left corner flange (connects to side wall inner face)
        true    // right corner flange (connects to side wall inner face)
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
