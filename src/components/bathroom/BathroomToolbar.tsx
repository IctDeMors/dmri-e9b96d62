import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ShowerHead, Toilet, Trash2, RotateCcw, Grid3X3, Plus } from "lucide-react";
import type { BathroomConfig, FloorShape, SanitaryType } from "./types";

interface BathroomToolbarProps {
  config: BathroomConfig;
  selectedItemId: string | null;
  onUpdateConfig: (updates: Partial<BathroomConfig>) => void;
  onAddSanitaryItem: (type: SanitaryType) => void;
  onDeleteSelectedItem: () => void;
  onRotateSelectedItem: () => void;
  onResetView: () => void;
}

export const BathroomToolbar = ({
  config,
  selectedItemId,
  onUpdateConfig,
  onAddSanitaryItem,
  onDeleteSelectedItem,
  onRotateSelectedItem,
  onResetView,
}: BathroomToolbarProps) => {
  const handleDimensionChange = (key: "width" | "depth" | "height", value: string) => {
    const numValue = parseInt(value) || 0;
    onUpdateConfig({
      dimensions: {
        ...config.dimensions,
        [key]: numValue,
      },
    });
  };

  const handleFloorShapeChange = (shape: FloorShape) => {
    const updates: Partial<BathroomConfig> = { floorShape: shape };
    
    if (shape === "l-shape" && !config.lShapeConfig) {
      updates.lShapeConfig = {
        mainWidth: config.dimensions.width,
        mainDepth: config.dimensions.depth,
        cutoutWidth: config.dimensions.width / 3,
        cutoutDepth: config.dimensions.depth / 3,
        cutoutCorner: "top-right",
      };
    }
    
    onUpdateConfig(updates);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      {/* Dimensions */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm">Afmetingen (mm)</h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Breedte</Label>
            <Input
              type="number"
              value={config.dimensions.width}
              onChange={(e) => handleDimensionChange("width", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Diepte</Label>
            <Input
              type="number"
              value={config.dimensions.depth}
              onChange={(e) => handleDimensionChange("depth", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Hoogte</Label>
            <Input
              type="number"
              value={config.dimensions.height}
              onChange={(e) => handleDimensionChange("height", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Floor Shape */}
      <div className="space-y-2">
        <Label className="text-sm">Vloervorm</Label>
        <Select value={config.floorShape} onValueChange={(v) => handleFloorShapeChange(v as FloorShape)}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rectangle">Rechthoek</SelectItem>
            <SelectItem value="l-shape">L-vorm</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* L-Shape Config */}
      {config.floorShape === "l-shape" && config.lShapeConfig && (
        <div className="space-y-3 p-3 bg-muted/50 rounded-md">
          <h4 className="text-xs font-medium text-muted-foreground">L-vorm Configuratie</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Uitsparing B</Label>
              <Input
                type="number"
                value={config.lShapeConfig.cutoutWidth}
                onChange={(e) => onUpdateConfig({
                  lShapeConfig: {
                    ...config.lShapeConfig!,
                    cutoutWidth: parseInt(e.target.value) || 0,
                  },
                })}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Uitsparing D</Label>
              <Input
                type="number"
                value={config.lShapeConfig.cutoutDepth}
                onChange={(e) => onUpdateConfig({
                  lShapeConfig: {
                    ...config.lShapeConfig!,
                    cutoutDepth: parseInt(e.target.value) || 0,
                  },
                })}
                className="h-7 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Uitsparing Hoek</Label>
            <Select 
              value={config.lShapeConfig.cutoutCorner} 
              onValueChange={(v) => onUpdateConfig({
                lShapeConfig: {
                  ...config.lShapeConfig!,
                  cutoutCorner: v as typeof config.lShapeConfig.cutoutCorner,
                },
              })}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top-right">Rechtsboven</SelectItem>
                <SelectItem value="top-left">Linksboven</SelectItem>
                <SelectItem value="bottom-right">Rechtsonder</SelectItem>
                <SelectItem value="bottom-left">Linksonder</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <Separator />

      {/* Door Configuration */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm">Deuropening</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Positie (mm)</Label>
            <Input
              type="number"
              value={config.doorConfig.position}
              onChange={(e) => onUpdateConfig({
                doorConfig: {
                  ...config.doorConfig,
                  position: parseInt(e.target.value) || 0,
                },
              })}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Breedte (mm)</Label>
            <Input
              type="number"
              value={config.doorConfig.width}
              onChange={(e) => onUpdateConfig({
                doorConfig: {
                  ...config.doorConfig,
                  width: parseInt(e.target.value) || 0,
                },
              })}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Add Sanitary Items */}
      <div className="space-y-2">
        <Label className="text-sm">Sanitair toevoegen</Label>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddSanitaryItem("shower")}
            className="gap-1"
          >
            <ShowerHead className="h-4 w-4" />
            Douche
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddSanitaryItem("toilet")}
            className="gap-1"
          >
            <Toilet className="h-4 w-4" />
            Toilet
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddSanitaryItem("vanity")}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Badmeubel
          </Button>
        </div>
      </div>

      {/* Selected Item Actions */}
      {selectedItemId && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="text-sm">Geselecteerd element</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRotateSelectedItem}
                className="gap-1"
              >
                <RotateCcw className="h-4 w-4" />
                Roteer
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onDeleteSelectedItem}
                className="gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Verwijder
              </Button>
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* View Options */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="showGrid"
            checked={config.showGrid}
            onCheckedChange={(checked) => onUpdateConfig({ showGrid: !!checked })}
          />
          <Label htmlFor="showGrid" className="text-sm font-normal flex items-center gap-1">
            <Grid3X3 className="h-4 w-4" />
            Toon raster
          </Label>
        </div>
        <Button variant="ghost" size="sm" onClick={onResetView} className="gap-1 w-full justify-start">
          <RotateCcw className="h-4 w-4" />
          Reset weergave
        </Button>
      </div>
    </div>
  );
};
