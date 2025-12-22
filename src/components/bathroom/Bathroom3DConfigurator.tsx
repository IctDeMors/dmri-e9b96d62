import { useState, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { BathroomScene } from "./BathroomScene";
import { BathroomToolbar } from "./BathroomToolbar";
import { PartitionWallEditor } from "./PartitionWallEditor";
import type { BathroomConfig, SanitaryItem, SanitaryType } from "./types";
import { DEFAULT_BATHROOM_CONFIG } from "./types";

interface Bathroom3DConfiguratorProps {
  initialConfig?: Partial<BathroomConfig>;
  onConfigChange?: (config: BathroomConfig) => void;
}

// Scale: 1000mm = 1 unit
const SCALE = 1 / 1000;

export const Bathroom3DConfigurator = ({
  initialConfig,
  onConfigChange,
}: Bathroom3DConfiguratorProps) => {
  const [config, setConfig] = useState<BathroomConfig>({
    ...DEFAULT_BATHROOM_CONFIG,
    ...initialConfig,
  });
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const updateConfig = useCallback((updates: Partial<BathroomConfig>) => {
    setConfig((prev) => {
      const newConfig = { ...prev, ...updates };
      onConfigChange?.(newConfig);
      return newConfig;
    });
  }, [onConfigChange]);

  const addSanitaryItem = useCallback((type: SanitaryType) => {
    const newItem: SanitaryItem = {
      id: crypto.randomUUID(),
      type,
      position: { x: 0, z: 0 },
      rotation: 0,
    };
    
    updateConfig({
      sanitaryItems: [...config.sanitaryItems, newItem],
    });
    setSelectedItemId(newItem.id);
  }, [config.sanitaryItems, updateConfig]);

  const deleteSelectedItem = useCallback(() => {
    if (!selectedItemId) return;
    
    updateConfig({
      sanitaryItems: config.sanitaryItems.filter((item) => item.id !== selectedItemId),
    });
    setSelectedItemId(null);
  }, [selectedItemId, config.sanitaryItems, updateConfig]);

  const rotateSelectedItem = useCallback(() => {
    if (!selectedItemId) return;
    
    updateConfig({
      sanitaryItems: config.sanitaryItems.map((item) =>
        item.id === selectedItemId
          ? { ...item, rotation: (item.rotation + 90) % 360 }
          : item
      ),
    });
  }, [selectedItemId, config.sanitaryItems, updateConfig]);

  const handleDragItem = useCallback((id: string, position: { x: number; z: number }) => {
    // Clamp position to bathroom bounds
    const halfWidth = config.dimensions.width / 2;
    const halfDepth = config.dimensions.depth / 2;
    
    const clampedX = Math.max(-halfWidth, Math.min(halfWidth, position.x));
    const clampedZ = Math.max(-halfDepth, Math.min(halfDepth, position.z));
    
    updateConfig({
      sanitaryItems: config.sanitaryItems.map((item) =>
        item.id === id
          ? { ...item, position: { x: clampedX, z: clampedZ } }
          : item
      ),
    });
  }, [config.dimensions, config.sanitaryItems, updateConfig]);

  const handleResetView = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, []);

  const handleUpdatePartitionWalls = useCallback((walls: typeof config.partitionWalls) => {
    updateConfig({ partitionWalls: walls });
  }, [updateConfig]);

  return (
    <div className="flex gap-4 h-[600px]">
      {/* Toolbar */}
      <div className="w-64 flex-shrink-0 overflow-y-auto space-y-4">
        <BathroomToolbar
          config={config}
          selectedItemId={selectedItemId}
          onUpdateConfig={updateConfig}
          onAddSanitaryItem={addSanitaryItem}
          onDeleteSelectedItem={deleteSelectedItem}
          onRotateSelectedItem={rotateSelectedItem}
          onResetView={handleResetView}
        />
        <PartitionWallEditor
          walls={config.partitionWalls}
          bathroomWidth={config.dimensions.width}
          bathroomDepth={config.dimensions.depth}
          bathroomHeight={config.dimensions.height}
          onUpdateWalls={handleUpdatePartitionWalls}
        />
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 bg-muted/30 rounded-lg border border-border overflow-hidden">
        <Canvas
          shadows
          camera={{
            position: [4, 4, 4],
            fov: 50,
            near: 0.1,
            far: 100,
          }}
          onClick={() => setSelectedItemId(null)}
        >
          <BathroomScene
            config={config}
            selectedItemId={selectedItemId}
            onSelectItem={setSelectedItemId}
            onDragItem={handleDragItem}
            controlsRef={controlsRef}
          />
        </Canvas>
      </div>
    </div>
  );
};

export default Bathroom3DConfigurator;
