import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileBox, Upload, Search, X, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import * as WebIFC from "web-ifc";

interface KozijnData {
  assemblyCode: string;
  name: string;
  type: string;
  category: string;
  count: number;
  expressIds: number[];
}

const TifaIFCConversie = () => {
  const [kozijnen, setKozijnen] = useState<KozijnData[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ifcApi, setIfcApi] = useState<WebIFC.IfcAPI | null>(null);
  const [selectedKozijn, setSelectedKozijn] = useState<KozijnData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initIfcApi = async () => {
      const api = new WebIFC.IfcAPI();
      api.SetWasmPath("https://unpkg.com/web-ifc@0.0.57/");
      await api.Init();
      setIfcApi(api);
    };
    initIfcApi();
  }, []);

  const getPropertyValue = (ifcApi: WebIFC.IfcAPI, modelID: number, expressID: number, propertyName: string): string => {
    try {
      const props = ifcApi.GetLine(modelID, expressID);
      if (props && props[propertyName]) {
        const value = props[propertyName];
        if (typeof value === 'object' && value.value !== undefined) {
          return String(value.value);
        }
        return String(value);
      }
    } catch (e) {
      // Property not found
    }
    return "";
  };

  const getFamilyName = (ifcApi: WebIFC.IfcAPI, modelID: number, expressID: number): string => {
    try {
      const element = ifcApi.GetLine(modelID, expressID, true);
      
      // Check IsTypedBy relationship to get the type
      if (element?.IsTypedBy) {
        const typedByRefs = Array.isArray(element.IsTypedBy) ? element.IsTypedBy : [element.IsTypedBy];
        
        for (const typedByRef of typedByRefs) {
          if (!typedByRef?.value) continue;
          
          try {
            const relDefines = ifcApi.GetLine(modelID, typedByRef.value, true);
            
            if (relDefines?.RelatingType?.value) {
              const typeElement = ifcApi.GetLine(modelID, relDefines.RelatingType.value, true);
              
              // Check HasPropertySets for IFCDOORLININGPROPERTIES or IFCWINDOWLININGPROPERTIES
              if (typeElement?.HasPropertySets) {
                const propSets = Array.isArray(typeElement.HasPropertySets) ? typeElement.HasPropertySets : [typeElement.HasPropertySets];
                
                for (const propSetRef of propSets) {
                  if (!propSetRef?.value) continue;
                  
                  try {
                    const propSet = ifcApi.GetLine(modelID, propSetRef.value);
                    const typeName = propSet?.constructor?.name || "";
                    
                    // Check if it's a lining properties entity
                    if (typeName.includes("LiningProperties") || typeName.includes("LININGPROPERTIES")) {
                      // Get the Name or Tag from the lining properties
                      if (propSet?.Name?.value) {
                        return String(propSet.Name.value);
                      }
                      if (propSet?.Tag?.value) {
                        return String(propSet.Tag.value);
                      }
                    }
                  } catch (e) {
                    continue;
                  }
                }
              }
              
              // Fallback: use the type name itself
              if (typeElement?.Name?.value) {
                return String(typeElement.Name.value);
              }
            }
          } catch (e) {
            continue;
          }
        }
      }
      
      // Fallback: check direct Name, ObjectType, or Tag
      const directElement = ifcApi.GetLine(modelID, expressID);
      if (directElement?.ObjectType?.value) {
        return String(directElement.ObjectType.value);
      }
      if (directElement?.Name?.value) {
        return String(directElement.Name.value);
      }
      if (directElement?.Tag?.value) {
        return String(directElement.Tag.value);
      }
      
    } catch (e) {
      console.error("Error getting family name:", e);
    }
    return "";
  };

  const debugLogElement = (ifcApi: WebIFC.IfcAPI, modelID: number, expressID: number, category: string) => {
    try {
      const element = ifcApi.GetLine(modelID, expressID);
      const propSets = ifcApi.GetLine(modelID, expressID, true);
      
      const debugInfo: Record<string, any> = {
        expressID,
        category,
        Name: element?.Name?.value,
        ObjectType: element?.ObjectType?.value,
        Tag: element?.Tag?.value,
        PredefinedType: element?.PredefinedType?.value,
      };
      
      // Collect all property values
      if (propSets?.IsDefinedBy) {
        const definitions = Array.isArray(propSets.IsDefinedBy) ? propSets.IsDefinedBy : [propSets.IsDefinedBy];
        const allProps: Record<string, any> = {};
        
        for (const def of definitions) {
          if (!def?.value) continue;
          try {
            const defLine = ifcApi.GetLine(modelID, def.value, true);
            if (defLine?.RelatingPropertyDefinition?.value) {
              const propDef = ifcApi.GetLine(modelID, defLine.RelatingPropertyDefinition.value, true);
              const propSetName = propDef?.Name?.value || "unknown";
              
              if (propDef?.HasProperties) {
                const props = Array.isArray(propDef.HasProperties) ? propDef.HasProperties : [propDef.HasProperties];
                for (const prop of props) {
                  if (!prop?.value) continue;
                  try {
                    const propLine = ifcApi.GetLine(modelID, prop.value);
                    const propName = propLine?.Name?.value || "";
                    const propValue = propLine?.NominalValue?.value;
                    allProps[`${propSetName}.${propName}`] = propValue;
                  } catch (e) {}
                }
              }
            }
          } catch (e) {}
        }
        debugInfo.properties = allProps;
      }
      
      console.log("IFC Element Debug:", debugInfo);
    } catch (e) {
      console.error("Debug error:", e);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !ifcApi) return;

    setIsLoading(true);
    setFileName(file.name);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      const modelID = ifcApi.OpenModel(uint8Array);
      
      const kozijnMap = new Map<string, KozijnData>();
      
      console.log("=== START IFC DEBUG ===");
      
      // Process Windows (IFCWINDOW = 3304561284)
      const windowIds = ifcApi.GetLineIDsWithType(modelID, 3304561284);
      console.log(`Found ${windowIds.size()} windows`);
      
      for (let i = 0; i < windowIds.size(); i++) {
        const expressID = windowIds.get(i);
        
        // Debug first 5 windows
        if (i < 5) {
          debugLogElement(ifcApi, modelID, expressID, "Window");
        }
        
        const familyName = getFamilyName(ifcApi, modelID, expressID);
        
        // Include all windows/doors with a family name
        if (familyName) {
          const element = ifcApi.GetLine(modelID, expressID);
          const name = element?.Name?.value || "Onbekend";
          const key = `${familyName}`;
          
          if (kozijnMap.has(key)) {
            const existing = kozijnMap.get(key)!;
            existing.count++;
            existing.expressIds.push(expressID);
          } else {
            kozijnMap.set(key, {
              assemblyCode: familyName,
              name,
              type: element?.ObjectType?.value || element?.PredefinedType?.value || "Window",
              category: "Window",
              count: 1,
              expressIds: [expressID],
            });
          }
        }
      }
      
      // Process Doors (IFCDOOR = 395920057)
      const doorIds = ifcApi.GetLineIDsWithType(modelID, 395920057);
      console.log(`Found ${doorIds.size()} doors`);
      
      for (let i = 0; i < doorIds.size(); i++) {
        const expressID = doorIds.get(i);
        
        // Debug first 5 doors
        if (i < 5) {
          debugLogElement(ifcApi, modelID, expressID, "Door");
        }
        
        const familyName = getFamilyName(ifcApi, modelID, expressID);
        
        // Include all windows/doors with a family name
        if (familyName) {
          const element = ifcApi.GetLine(modelID, expressID);
          const name = element?.Name?.value || "Onbekend";
          const key = `${familyName}`;
          
          if (kozijnMap.has(key)) {
            const existing = kozijnMap.get(key)!;
            existing.count++;
            existing.expressIds.push(expressID);
          } else {
            kozijnMap.set(key, {
              assemblyCode: familyName,
              name,
              type: element?.ObjectType?.value || element?.PredefinedType?.value || "Door",
              category: "Door",
              count: 1,
              expressIds: [expressID],
            });
          }
        }
      }
      
      console.log("=== END IFC DEBUG ===");
      
      ifcApi.CloseModel(modelID);
      
      const results = Array.from(kozijnMap.values()).sort((a, b) => 
        a.assemblyCode.localeCompare(b.assemblyCode)
      );
      
      setKozijnen(results);
      
      if (results.length === 0) {
        toast.warning("Geen kozijnen gevonden");
      } else {
        toast.success(`${results.length} unieke kozijn types gevonden`);
      }
      
    } catch (error) {
      console.error("Error parsing IFC:", error);
      toast.error("Fout bij het verwerken van het IFC bestand");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredKozijnen = kozijnen.filter(k => 
    k.assemblyCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const clearData = () => {
    setKozijnen([]);
    setFileName(null);
    setSearchQuery("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-emerald-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Link to="/tifa">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 -ml-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">IFC Conversie</h1>
              <p className="text-white/70 text-sm">Unieke kozijnen uit IFC (windows en doors)</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileBox className="w-5 h-5" />
              IFC Kozijn Analyse
            </CardTitle>
            <CardDescription>
              Upload een IFC bestand om alle unieke kozijnen te vinden (windows en doors via family name/type name)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".ifc"
                onChange={handleFileUpload}
                className="hidden"
                id="ifc-upload"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || !ifcApi}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verwerken...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload IFC
                  </>
                )}
              </Button>
              
              {fileName && (
                <span className="text-sm text-muted-foreground">
                  {fileName}
                </span>
              )}
              
              {kozijnen.length > 0 && (
                <Button variant="outline" onClick={clearData}>
                  <X className="w-4 h-4 mr-2" />
                  Wissen
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {kozijnen.length > 0 && (
          <>
            <div className="mb-4 flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Zoeken op assembly code, naam of type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Badge variant="secondary">
                {filteredKozijnen.length} unieke types
              </Badge>
            </div>

            <div className="grid gap-3">
              {filteredKozijnen.map((kozijn, index) => (
                <Card 
                  key={index}
                  className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
                  onClick={() => setSelectedKozijn(kozijn)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge variant={kozijn.category === "Window" ? "default" : "secondary"}>
                        {kozijn.category}
                      </Badge>
                      <div>
                        <p className="font-medium">{kozijn.assemblyCode}</p>
                        <p className="text-sm text-muted-foreground">{kozijn.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{kozijn.count}x</Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {kozijnen.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <FileBox className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Upload een IFC bestand om kozijnen te analyseren
            </p>
          </div>
        )}
      </main>

      <Dialog open={!!selectedKozijn} onOpenChange={() => setSelectedKozijn(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kozijn Details</DialogTitle>
          </DialogHeader>
          {selectedKozijn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Assembly Code</p>
                  <p className="font-medium">{selectedKozijn.assemblyCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Categorie</p>
                  <Badge variant={selectedKozijn.category === "Window" ? "default" : "secondary"}>
                    {selectedKozijn.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Naam</p>
                  <p className="font-medium">{selectedKozijn.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{selectedKozijn.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aantal</p>
                  <p className="font-medium">{selectedKozijn.count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Express IDs</p>
                  <p className="font-medium text-xs">{selectedKozijn.expressIds.slice(0, 5).join(", ")}{selectedKozijn.expressIds.length > 5 ? "..." : ""}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TifaIFCConversie;
