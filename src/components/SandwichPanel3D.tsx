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

const getLayerHeight = (laag: Laag): number => {
  return laag.type === "Isolatie" ? 0.4 : 0.1;
};

interface LayerMeshProps {
  laag: Laag;
  yPosition: number;
  height: number;
}

const LayerMesh = ({ laag, yPosition, height }: LayerMeshProps) => {
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
    const positions: { laag: Laag; yPosition: number; height: number }[] = [];
    let currentY = 0;

    lagen.forEach((laag) => {
      const height = getLayerHeight(laag);
      positions.push({
        laag,
        yPosition: currentY + height / 2,
        height,
      });
      currentY += height;
    });

    // Center the stack vertically
    const totalHeight = currentY;
    const offset = totalHeight / 2;
    return positions.map((p) => ({
      ...p,
      yPosition: p.yPosition - offset,
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
        {layerPositions.map(({ laag, yPosition, height }) => (
          <LayerMesh key={laag.id} laag={laag} yPosition={yPosition} height={height} />
        ))}
      </group>
      
      <OrbitControls enableZoom={true} enablePan={false} />
    </Canvas>
  );
};

export default SandwichPanel3D;
