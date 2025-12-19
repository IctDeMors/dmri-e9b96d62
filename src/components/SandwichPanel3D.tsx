import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";

type LaagType = "volkern" | "isolatie";
type IsolatieMateriaal = "Pir" | "Pur" | "XPS";
type VolkernMateriaal = "trespa" | "renolit" | "glas" | "staal" | "aluminium";

interface Laag {
  id: number;
  type: LaagType;
  materiaal: IsolatieMateriaal | VolkernMateriaal;
}

interface SandwichPanel3DProps {
  lagen: Laag[];
}

const getLayerColor = (laag: Laag): string => {
  if (laag.type === "isolatie") {
    switch (laag.materiaal) {
      case "Pir": return "#FFD700";
      case "Pur": return "#FFA500";
      case "XPS": return "#87CEEB";
      default: return "#FFD700";
    }
  } else {
    switch (laag.materiaal) {
      case "trespa": return "#4A4A4A";
      case "renolit": return "#F5F5DC";
      case "glas": return "#ADD8E6";
      case "staal": return "#C0C0C0";
      case "aluminium": return "#A9A9A9";
      default: return "#4A4A4A";
    }
  }
};

const getLayerHeight = (laag: Laag): number => {
  return laag.type === "isolatie" ? 0.4 : 0.1;
};

interface LayerMeshProps {
  laag: Laag;
  yPosition: number;
  height: number;
}

const LayerMesh = ({ laag, yPosition, height }: LayerMeshProps) => {
  const color = getLayerColor(laag);
  const isGlass = laag.materiaal === "glas";

  return (
    <mesh position={[0, yPosition, 0]}>
      <boxGeometry args={[2, height, 1.5]} />
      <meshStandardMaterial
        color={color}
        transparent={isGlass}
        opacity={isGlass ? 0.6 : 1}
        metalness={laag.type === "volkern" && (laag.materiaal === "staal" || laag.materiaal === "aluminium") ? 0.8 : 0.1}
        roughness={laag.type === "volkern" && (laag.materiaal === "staal" || laag.materiaal === "aluminium") ? 0.2 : 0.5}
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
