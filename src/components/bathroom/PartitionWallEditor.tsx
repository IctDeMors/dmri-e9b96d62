import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Minus } from "lucide-react";
import type { PartitionWall } from "./types";

interface PartitionWallEditorProps {
  walls: PartitionWall[];
  bathroomWidth: number;
  bathroomDepth: number;
  bathroomHeight: number;
  onUpdateWalls: (walls: PartitionWall[]) => void;
}

export const PartitionWallEditor = ({
  walls,
  bathroomWidth,
  bathroomDepth,
  bathroomHeight,
  onUpdateWalls,
}: PartitionWallEditorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const addWall = () => {
    const newWall: PartitionWall = {
      id: crypto.randomUUID(),
      startX: 0,
      startZ: bathroomDepth / 4,
      endX: bathroomWidth / 2,
      endZ: bathroomDepth / 4,
      height: bathroomHeight,
    };
    onUpdateWalls([...walls, newWall]);
  };

  const updateWall = (id: string, updates: Partial<PartitionWall>) => {
    onUpdateWalls(
      walls.map((wall) => (wall.id === id ? { ...wall, ...updates } : wall))
    );
  };

  const deleteWall = (id: string) => {
    onUpdateWalls(walls.filter((wall) => wall.id !== id));
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Scheidingswanden</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-3 pt-0">
          <Button variant="outline" size="sm" onClick={addWall} className="w-full gap-1">
            <Plus className="h-3 w-3" />
            Scheidingswand toevoegen
          </Button>

          {walls.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              Geen scheidingswanden
            </p>
          ) : (
            <div className="space-y-3">
              {walls.map((wall, index) => (
                <div key={wall.id} className="p-2 border rounded-md space-y-2 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Wand {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => deleteWall(wall.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Start X</Label>
                      <Input
                        type="number"
                        value={wall.startX}
                        onChange={(e) => updateWall(wall.id, { startX: parseInt(e.target.value) || 0 })}
                        className="h-6 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Start Z</Label>
                      <Input
                        type="number"
                        value={wall.startZ}
                        onChange={(e) => updateWall(wall.id, { startZ: parseInt(e.target.value) || 0 })}
                        className="h-6 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Eind X</Label>
                      <Input
                        type="number"
                        value={wall.endX}
                        onChange={(e) => updateWall(wall.id, { endX: parseInt(e.target.value) || 0 })}
                        className="h-6 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Eind Z</Label>
                      <Input
                        type="number"
                        value={wall.endZ}
                        onChange={(e) => updateWall(wall.id, { endZ: parseInt(e.target.value) || 0 })}
                        className="h-6 text-xs"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-[10px]">Hoogte (mm)</Label>
                    <Input
                      type="number"
                      value={wall.height}
                      onChange={(e) => updateWall(wall.id, { height: parseInt(e.target.value) || bathroomHeight })}
                      className="h-6 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
