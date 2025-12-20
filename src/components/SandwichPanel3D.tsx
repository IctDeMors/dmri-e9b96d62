import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";

type LaagType = "Volkern" | "Isolatie";

interface Laag {
  id: number;
  type: LaagType;
  artikelgroep: string;
  artikel: string;
  optimcode: string;
  description: string;
  dikte: number; // ZDIMSIZE in mm
}

interface SandwichPanel3DProps {
  lagen: Laag[];
}

const getLayerColor = (laag: Laag): string => {
  const artikelgroep = laag.artikelgroep.toLowerCase();
  
  if (laag.type === "Isolatie") {
    if (artikelgroep.includes("pir")) return "#FFD700";
    if (artikelgroep.includes("pur")) return "#FFA500";
    if (artikelgroep.includes("xps")) return "#87CEEB";
    return "#FFD700";
  } else {
    if (artikelgroep.includes("trespa") || artikelgroep.includes("tr-")) return "#4A4A4A";
    if (artikelgroep.includes("renolit")) return "#F5F5DC";
    if (artikelgroep.includes("glas")) return "#ADD8E6";
    if (artikelgroep.includes("staal")) return "#C0C0C0";
    if (artikelgroep.includes("alu")) return "#A9A9A9";
    if (artikelgroep.includes("polyester")) return "#8FBC8F";
    return "#4A4A4A";
  }
};

// Scale factor: 1mm = 0.01 units in 3D, with min/max bounds for visibility
const getLayerHeight = (laag: Laag): number => {
  const dikteInMm = laag.dikte || (laag.type === "Isolatie" ? 50 : 3); // Default fallback
  // Scale: divide by 50 to make 50mm = 1 unit, with min 0.05 and max 3
  const scaled = dikteInMm / 50;
  return Math.max(0.05, Math.min(3, scaled));
};

interface LayerMeshProps {
  laag: Laag;
  yPosition: number;
  height: number;
  index: number;
}

const LayerMesh = ({ laag, yPosition, height, index }: LayerMeshProps) => {
  const color = getLayerColor(laag);
  const artikelgroep = laag.artikelgroep.toLowerCase();
  const isGlass = artikelgroep.includes("glas");
  const isMetal = artikelgroep.includes("staal") || artikelgroep.includes("alu");

  return (
    <mesh position={[0, yPosition, 0]}>
      <boxGeometry args={[2, height, 1.5]} />
      <meshStandardMaterial
        color={color}
        transparent={isGlass}
        opacity={isGlass ? 0.6 : 1}
        metalness={isMetal ? 0.8 : 0.1}
        roughness={isMetal ? 0.2 : 0.5}
      />
    </mesh>
  );
};

const SandwichPanel3D = ({ lagen }: SandwichPanel3DProps) => {
  const layerPositions = useMemo(() => {
    const positions: { laag: Laag; yPosition: number; height: number; index: number }[] = [];
    
    // Reverse order: layer 1 (index 0) is at the top
    // We build from top to bottom, so start at 0 and go down
    let currentY = 0;

    // Process layers in reverse order so layer 1 is on top
    const reversedLagen = [...lagen].reverse();
    
    reversedLagen.forEach((laag, reverseIndex) => {
      const originalIndex = lagen.length - 1 - reverseIndex;
      const height = getLayerHeight(laag);
      // Place layer below current position (growing downward)
      currentY -= height;
      positions.push({
        laag,
        yPosition: currentY + height / 2,
        height,
        index: originalIndex,
      });
    });

    // Center the stack vertically
    const totalHeight = Math.abs(currentY);
    const offset = totalHeight / 2;
    
    return positions.map((p) => ({
      ...p,
      yPosition: p.yPosition + offset,
    }));
  }, [lagen]);

  if (lagen.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
        Voeg lagen toe om preview te zien
      </div>
    );
  }

  return (
    <Canvas camera={{ position: [3, 2, 3], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />
      
      <group>
        {layerPositions.map(({ laag, yPosition, height, index }) => (
          <LayerMesh key={laag.id} laag={laag} yPosition={yPosition} height={height} index={index} />
        ))}
      </group>
      
      <OrbitControls enableZoom={true} enablePan={false} />
    </Canvas>
  );
};

export default SandwichPanel3D;
