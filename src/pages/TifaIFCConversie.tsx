import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileBox, Upload, Search, X, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import * as WebIFC from "web-ifc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KozijnProperties {
  bouwblok: string;
  bouwdeel: string;
  bouwlaag: string;
  breedte: string;
  hoogte: string;
  projectX: string;
  projectY: string;
  projectZ: string;
  rotatieVectorX: string;
  rotatieVectorY: string;
  rotatieVectorZ: string;
  gevel: string; // genormaliseerde gevel (voorgevel/achtergevel/...)
  gevelGroep: string; // ruwe groepsnaam uit IFC
}

interface KozijnInstance {
  expressId: number;
  name: string;
  properties: KozijnProperties;
}

interface KozijnData {
  assemblyCode: string;
  name: string;
  type: string;
  category: string;
  count: number;
  expressIds: number[];
  instances: KozijnInstance[];
  properties: KozijnProperties;
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

  const extractTransformData = (flatTransformation: number[] | Float32Array) => {
    const x = flatTransformation[12]?.toFixed(3) || "0";
    const y = flatTransformation[13]?.toFixed(3) || "0";
    const z = flatTransformation[14]?.toFixed(3) || "0";

    const rotX = Math.atan2(flatTransformation[6], flatTransformation[10]) * (180 / Math.PI);
    const rotY = Math.atan2(-flatTransformation[2], Math.sqrt(flatTransformation[6] ** 2 + flatTransformation[10] ** 2)) * (180 / Math.PI);
    const rotZ = Math.atan2(flatTransformation[1], flatTransformation[0]) * (180 / Math.PI);

    return {
      x,
      y,
      z,
      rotX: rotX.toFixed(1),
      rotY: rotY.toFixed(1),
      rotZ: rotZ.toFixed(1),
    };
  };

  // Haal de gevel op via meerdere mogelijke relaties
  const getGevelFromRelations = (ifcApi: WebIFC.IfcAPI, modelID: number, expressID: number, debugFirst: boolean = false): string => {
    try {
      // Methode 1: Direct via IFCRELASSIGNSTOGROUP op het kozijn zelf
      const relAssignsIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCRELASSIGNSTOGROUP);
      
      if (debugFirst) console.log("Aantal IFCRELASSIGNSTOGROUP relaties:", relAssignsIds.size());
      
      for (let i = 0; i < relAssignsIds.size(); i++) {
        const relId = relAssignsIds.get(i);
        const rel = ifcApi.GetLine(modelID, relId);
        
        if (rel.RelatedObjects) {
          const relatedObjects = Array.isArray(rel.RelatedObjects) ? rel.RelatedObjects : [rel.RelatedObjects];
          
          for (const obj of relatedObjects) {
            if (obj?.value === expressID) {
              const groupId = rel.RelatingGroup?.value;
              if (groupId) {
                const group = ifcApi.GetLine(modelID, groupId);
                const groupName = group.Name?.value || group.Description?.value || "";
                if (debugFirst) console.log("Methode 1 - Direct groep gevonden:", groupName);
                return String(groupName);
              }
            }
          }
        }
      }
      
      if (debugFirst) console.log("Methode 1 - Geen directe groep gevonden, probeer via wall...");
      
      // Methode 2: Via IFCRELFILLSELEMENT -> Opening -> IFCRELVOIDSELEMENT -> Wall -> Group
      const relFillsIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCRELFILLSELEMENT);
      let openingId: number | null = null;
      
      for (let i = 0; i < relFillsIds.size(); i++) {
        const relId = relFillsIds.get(i);
        const rel = ifcApi.GetLine(modelID, relId);
        
        if (rel.RelatedBuildingElement?.value === expressID) {
          openingId = rel.RelatingOpeningElement?.value;
          if (debugFirst) console.log("Methode 2 - Opening gevonden:", openingId);
          break;
        }
      }
      
      if (openingId) {
        const relVoidsIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCRELVOIDSELEMENT);
        let wallId: number | null = null;
        
        for (let i = 0; i < relVoidsIds.size(); i++) {
          const relId = relVoidsIds.get(i);
          const rel = ifcApi.GetLine(modelID, relId);
          
          if (rel.RelatedOpeningElement?.value === openingId) {
            wallId = rel.RelatingBuildingElement?.value;
            if (debugFirst) {
              const wall = ifcApi.GetLine(modelID, wallId);
              console.log("Methode 2 - Wall gevonden:", wallId, "Name:", wall?.Name?.value);
            }
            break;
          }
        }
        
        if (wallId) {
          for (let i = 0; i < relAssignsIds.size(); i++) {
            const relId = relAssignsIds.get(i);
            const rel = ifcApi.GetLine(modelID, relId);
            
            if (rel.RelatedObjects) {
              const relatedObjects = Array.isArray(rel.RelatedObjects) ? rel.RelatedObjects : [rel.RelatedObjects];
              
              for (const obj of relatedObjects) {
                if (obj?.value === wallId) {
                  const groupId = rel.RelatingGroup?.value;
                  if (groupId) {
                    const group = ifcApi.GetLine(modelID, groupId);
                    const groupName = group.Name?.value || group.Description?.value || "";
                    if (debugFirst) console.log("Methode 2 - Wall groep gevonden:", groupName);
                    return String(groupName);
                  }
                }
              }
            }
          }
        }
      }
      
      if (debugFirst) console.log("Methode 2 - Geen groep via wall gevonden, probeer via ContainedInStructure...");
      
      // Methode 3: Zoek naar welke wall dit element bevat via spatial structure
      // Sommige IFC files hebben het kozijn direct in de spatial structure
      const element = ifcApi.GetLine(modelID, expressID, true);
      
      // Check if element has a direct reference to a host (wall)
      if (element?.FillsVoids) {
        const fillsVoids = Array.isArray(element.FillsVoids) ? element.FillsVoids : [element.FillsVoids];
        for (const fv of fillsVoids) {
          if (fv?.value) {
            try {
              const relFills = ifcApi.GetLine(modelID, fv.value);
              if (relFills?.RelatingOpeningElement?.value) {
                const opening = ifcApi.GetLine(modelID, relFills.RelatingOpeningElement.value, true);
                if (opening?.VoidsElements) {
                  const voidsElements = Array.isArray(opening.VoidsElements) ? opening.VoidsElements : [opening.VoidsElements];
                  for (const ve of voidsElements) {
                    if (ve?.value) {
                      const relVoids = ifcApi.GetLine(modelID, ve.value);
                      if (relVoids?.RelatingBuildingElement?.value) {
                        const wallId = relVoids.RelatingBuildingElement.value;
                        const wall = ifcApi.GetLine(modelID, wallId);
                        if (debugFirst) console.log("Methode 3 - Wall via FillsVoids:", wallId, wall?.Name?.value);
                        
                        // Now find group for this wall
                        for (let i = 0; i < relAssignsIds.size(); i++) {
                          const relId = relAssignsIds.get(i);
                          const rel = ifcApi.GetLine(modelID, relId);
                          
                          if (rel.RelatedObjects) {
                            const relatedObjects = Array.isArray(rel.RelatedObjects) ? rel.RelatedObjects : [rel.RelatedObjects];
                            for (const obj of relatedObjects) {
                              if (obj?.value === wallId) {
                                const groupId = rel.RelatingGroup?.value;
                                if (groupId) {
                                  const group = ifcApi.GetLine(modelID, groupId);
                                  const groupName = group.Name?.value || group.Description?.value || "";
                                  if (debugFirst) console.log("Methode 3 - Groep gevonden:", groupName);
                                  return String(groupName);
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            } catch (e) {}
          }
        }
      }
      
      if (debugFirst) console.log("Geen gevel groep gevonden via alle methodes");
      return "";
    } catch (e) {
      console.error("Error getting gevel from relations:", e);
      return "";
    }
  };

  const normalizeGevelLabel = (groupName: string): string => {
    const raw = (groupName || "").trim();
    const n = raw.toLowerCase();
    if (!n) return "";

    if (n.includes("voor")) return "Voorgevel";
    if (n.includes("achter")) return "Achtergevel";
    if (n.includes("link") || n.includes("links")) return "Linker zijgevel";
    if (n.includes("recht") || n.includes("rechts")) return "Rechter zijgevel";

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
        // Direct element dimensions (standard IFC)
        OverallWidth: element?.OverallWidth?.value,
        OverallHeight: element?.OverallHeight?.value,
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
              
              // Also log quantities
              if (propDef?.Quantities) {
                const quantities = Array.isArray(propDef.Quantities) ? propDef.Quantities : [propDef.Quantities];
                for (const qty of quantities) {
                  if (!qty?.value) continue;
                  try {
                    const qtyLine = ifcApi.GetLine(modelID, qty.value);
                    const qtyName = qtyLine?.Name?.value || "";
                    const qtyValue = qtyLine?.LengthValue?.value || qtyLine?.AreaValue?.value || qtyLine?.VolumeValue?.value;
                    allProps[`QTO.${qtyName}`] = qtyValue;
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

  const getKozijnProperties = (ifcApi: WebIFC.IfcAPI, modelID: number, expressID: number, debugGevel: boolean = false): KozijnProperties => {
    const props: KozijnProperties = {
      bouwblok: "",
      bouwdeel: "",
      bouwlaag: "",
      breedte: "",
      hoogte: "",
      projectX: "",
      projectY: "",
      projectZ: "",
      rotatieVectorX: "",
      rotatieVectorY: "",
      rotatieVectorZ: "",
      gevel: "",
      gevelGroep: "",
    };

    try {
      const element = ifcApi.GetLine(modelID, expressID, true);
      const basicElement = ifcApi.GetLine(modelID, expressID);
      
      // Get dimensions directly from IFCWINDOW/IFCDOOR element (OverallWidth, OverallHeight)
      // These values are already in mm in this IFC file
      if (basicElement?.OverallWidth?.value !== undefined) {
        props.breedte = String(Math.round(basicElement.OverallWidth.value));
      }
      if (basicElement?.OverallHeight?.value !== undefined) {
        props.hoogte = String(Math.round(basicElement.OverallHeight.value));
      }
      
      // Get transform data using GetFlatMesh (same method as TifaIFC.tsx)
      try {
        const mesh = ifcApi.GetFlatMesh(modelID, expressID);
        if (mesh.geometries.size() > 0) {
          const placedGeometry = mesh.geometries.get(0);
          const transformData = extractTransformData(placedGeometry.flatTransformation);
          props.projectX = transformData.x;
          props.projectY = transformData.y;
          props.projectZ = transformData.z;
          props.rotatieVectorX = transformData.rotX;
          props.rotatieVectorY = transformData.rotY;
          props.rotatieVectorZ = transformData.rotZ;
        }
      } catch (e) {}
      
      // Get gevel from wall -> group relationship
      const gevelGroep = getGevelFromRelations(ifcApi, modelID, expressID, debugGevel);
      props.gevelGroep = gevelGroep;
      props.gevel = normalizeGevelLabel(gevelGroep) || gevelGroep;
      
      // Get spatial containment for bouwblok, bouwdeel, bouwlaag
      try {
        const relContainedIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE);
        for (let j = 0; j < relContainedIds.size(); j++) {
          const relId = relContainedIds.get(j);
          const rel = ifcApi.GetLine(modelID, relId);
          
          if (rel.RelatedElements) {
            const elements = rel.RelatedElements;
            for (let k = 0; k < elements.length; k++) {
              if (elements[k].value === expressID) {
                const spatialId = rel.RelatingStructure?.value;
                if (spatialId) {
                  const spatial = ifcApi.GetLine(modelID, spatialId);
                  const spatialType = spatial.constructor?.name || "";
                  const spatialName = spatial.Name?.value || spatial.LongName?.value || "";
                  
                  if (spatialType.includes("STOREY") || spatialType.includes("Storey")) {
                    props.bouwlaag = spatialName;
                  } else if (spatialType.includes("BUILDING") || spatialType.includes("Building")) {
                    props.bouwdeel = spatialName;
                  } else if (spatialType.includes("SITE") || spatialType.includes("Site")) {
                    props.bouwblok = spatialName;
                  }
                }
                break;
              }
            }
          }
        }
      } catch (e) {}

    } catch (e) {
      console.error("Error getting kozijn properties:", e);
    }

    return props;
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
        const debugThis = i < 3; // Debug first 3 windows
        
        // Debug first 5 windows
        if (i < 5) {
          debugLogElement(ifcApi, modelID, expressID, "Window");
        }
        
        // Debug gevel lookup for first 3 windows
        if (debugThis) {
          console.log(`\n=== GEVEL DEBUG Window ${i + 1} (expressID: ${expressID}) ===`);
        }
        
        const familyName = getFamilyName(ifcApi, modelID, expressID);
        
        // Include all windows/doors with a family name
        if (familyName) {
          const element = ifcApi.GetLine(modelID, expressID);
          const name = element?.Name?.value || "Onbekend";
          const key = `${familyName}`;
          const kozijnProps = getKozijnProperties(ifcApi, modelID, expressID, debugThis);
          const instance: KozijnInstance = { expressId: expressID, name, properties: kozijnProps };
          
          if (kozijnMap.has(key)) {
            const existing = kozijnMap.get(key)!;
            existing.count++;
            existing.expressIds.push(expressID);
            existing.instances.push(instance);
          } else {
            kozijnMap.set(key, {
              assemblyCode: familyName,
              name,
              type: element?.ObjectType?.value || element?.PredefinedType?.value || "Window",
              category: "Window",
              count: 1,
              expressIds: [expressID],
              instances: [instance],
              properties: kozijnProps,
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
          const kozijnProps = getKozijnProperties(ifcApi, modelID, expressID);
          const instance: KozijnInstance = { expressId: expressID, name, properties: kozijnProps };
          
          if (kozijnMap.has(key)) {
            const existing = kozijnMap.get(key)!;
            existing.count++;
            existing.expressIds.push(expressID);
            existing.instances.push(instance);
          } else {
            kozijnMap.set(key, {
              assemblyCode: familyName,
              name,
              type: element?.ObjectType?.value || element?.PredefinedType?.value || "Door",
              category: "Door",
              count: 1,
              expressIds: [expressID],
              instances: [instance],
              properties: kozijnProps,
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

      {/* Detail view for selected kozijn */}
      {selectedKozijn && (
        <div className="fixed inset-0 z-50 bg-background">
          <header className="border-b border-border bg-emerald-700">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/10 -ml-2"
                  onClick={() => setSelectedKozijn(null)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-white">{selectedKozijn.assemblyCode}</h1>
                  <p className="text-white/70 text-sm">
                    {selectedKozijn.category} • {selectedKozijn.count} exemplaren
                  </p>
                </div>
              </div>
            </div>
          </header>

          <main className="container mx-auto px-6 py-6">
            <Card>
              <CardHeader>
                <CardTitle>Alle Exemplaren</CardTitle>
                <CardDescription>
                  Overzicht van alle {selectedKozijn.count} exemplaren met hun eigenschappen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Express ID</TableHead>
                        <TableHead>Naam</TableHead>
                        <TableHead>Gevel</TableHead>
                        <TableHead>Bouwblok</TableHead>
                        <TableHead>Bouwdeel</TableHead>
                        <TableHead>Bouwlaag</TableHead>
                        <TableHead className="text-right">Breedte (mm)</TableHead>
                        <TableHead className="text-right">Hoogte (mm)</TableHead>
                        <TableHead className="text-right">Project X</TableHead>
                        <TableHead className="text-right">Project Y</TableHead>
                        <TableHead className="text-right">Project Z</TableHead>
                        <TableHead className="text-right">Rot. X</TableHead>
                        <TableHead className="text-right">Rot. Y</TableHead>
                        <TableHead className="text-right">Rot. Z</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedKozijn.instances.map((instance) => (
                        <TableRow key={instance.expressId}>
                          <TableCell className="font-mono text-xs">{instance.expressId}</TableCell>
                          <TableCell className="text-sm">{instance.name}</TableCell>
                          <TableCell>
                            <div className="min-w-[140px]">
                              <div>{instance.properties.gevel || "-"}</div>
                              {instance.properties.gevelGroep && instance.properties.gevelGroep !== instance.properties.gevel && (
                                <div className="text-xs text-muted-foreground truncate max-w-[260px]" title={instance.properties.gevelGroep}>
                                  {instance.properties.gevelGroep}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{instance.properties.bouwblok || "-"}</TableCell>
                          <TableCell>{instance.properties.bouwdeel || "-"}</TableCell>
                          <TableCell>{instance.properties.bouwlaag || "-"}</TableCell>
                          <TableCell className="text-right font-mono">{instance.properties.breedte || "-"}</TableCell>
                          <TableCell className="text-right font-mono">{instance.properties.hoogte || "-"}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{instance.properties.projectX || "-"}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{instance.properties.projectY || "-"}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{instance.properties.projectZ || "-"}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{instance.properties.rotatieVectorX || "-"}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{instance.properties.rotatieVectorY || "-"}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{instance.properties.rotatieVectorZ || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </main>
        </div>
      )}
    </div>
  );
};

export default TifaIFCConversie;
