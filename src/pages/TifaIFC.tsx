import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileBox, Upload, Search, Filter, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import * as WebIFC from "web-ifc";

interface IFCDataRow {
  merk: string;
  bouwblok: string;
  bouwdeel: string;
  bouwlaag: string;
  breedte: string;
  hoogte: string;
  projectX: string;
  projectY: string;
  projectZ: string;
  rotatieX: string;
  rotatieY: string;
  rotatieZ: string;
}

const TifaIFC = () => {
  const [data, setData] = useState<IFCDataRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ifcApi, setIfcApi] = useState<WebIFC.IfcAPI | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize web-ifc API
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
    // Extract position from the 4x4 transformation matrix (column-major)
    // Position is in the last column (indices 12, 13, 14)
    const x = flatTransformation[12]?.toFixed(3) || "0";
    const y = flatTransformation[13]?.toFixed(3) || "0";
    const z = flatTransformation[14]?.toFixed(3) || "0";

    // Extract rotation from the rotation part of the matrix
    // This is a simplified extraction - actual rotation would need quaternion/euler conversion
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !ifcApi) return;

    setIsLoading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const modelId = ifcApi.OpenModel(uint8Array);
      const rows: IFCDataRow[] = [];

      // Only extract IfcWindow and IfcDoor entities
      const elementTypes = [
        { type: WebIFC.IFCWINDOW, prefix: "Window" },
        { type: WebIFC.IFCDOOR, prefix: "Door" },
      ];

      for (const { type, prefix } of elementTypes) {
        const elementIds = ifcApi.GetLineIDsWithType(modelId, type);
        
        for (let i = 0; i < elementIds.size(); i++) {
          const expressId = elementIds.get(i);
          const props = ifcApi.GetLine(modelId, expressId);
          
          // Get element name/tag
          const name = props.Name?.value || props.Tag?.value || `${prefix}.${expressId}`;
          
          // Get dimensions
          const width = props.OverallWidth?.value?.toFixed(0) || "";
          const height = props.OverallHeight?.value?.toFixed(0) || "";

          // Try to get placement/transformation
          let transformData = {
            x: "",
            y: "",
            z: "",
            rotX: "",
            rotY: "",
            rotZ: "",
          };

          try {
            const mesh = ifcApi.GetFlatMesh(modelId, expressId);
            if (mesh.geometries.size() > 0) {
              const placedGeometry = mesh.geometries.get(0);
              transformData = extractTransformData(placedGeometry.flatTransformation);
            }
          } catch (e) {
            // Some elements might not have geometry
          }

          // Get building structure info (if available)
          let bouwblok = "";
          let bouwdeel = "";
          let bouwlaag = "";

          // Try to find spatial containment
          try {
            const relContainedIds = ifcApi.GetLineIDsWithType(modelId, WebIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE);
            for (let j = 0; j < relContainedIds.size(); j++) {
              const relId = relContainedIds.get(j);
              const rel = ifcApi.GetLine(modelId, relId);
              
              if (rel.RelatedElements) {
                const elements = rel.RelatedElements;
                for (let k = 0; k < elements.length; k++) {
                  if (elements[k].value === expressId) {
                    // Found the spatial structure containing this element
                    const spatialId = rel.RelatingStructure?.value;
                    if (spatialId) {
                      const spatial = ifcApi.GetLine(modelId, spatialId);
                      const spatialType = spatial.constructor?.name || "";
                      const spatialName = spatial.Name?.value || spatial.LongName?.value || "";
                      
                      if (spatialType.includes("STOREY") || spatialType.includes("Storey")) {
                        bouwlaag = spatialName;
                      } else if (spatialType.includes("BUILDING") || spatialType.includes("Building")) {
                        bouwdeel = spatialName;
                      } else if (spatialType.includes("SITE") || spatialType.includes("Site")) {
                        bouwblok = spatialName;
                      }
                    }
                    break;
                  }
                }
              }
            }
          } catch (e) {
            // Spatial containment extraction failed
          }

          rows.push({
            merk: name,
            bouwblok,
            bouwdeel,
            bouwlaag,
            breedte: width,
            hoogte: height,
            projectX: transformData.x,
            projectY: transformData.y,
            projectZ: transformData.z,
            rotatieX: transformData.rotX,
            rotatieY: transformData.rotY,
            rotatieZ: transformData.rotZ,
          });
        }
      }

      ifcApi.CloseModel(modelId);

      setData(rows);
      setFileName(file.name);
      toast.success(`${rows.length} elementen geëxtraheerd uit ${file.name}`);
    } catch (error) {
      console.error("IFC parsing error:", error);
      toast.error("Fout bij het lezen van het IFC bestand");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearData = () => {
    setData([]);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredData = data.filter((row) =>
    row.merk.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <h1 className="text-xl font-bold text-white">IFC Data</h1>
              <p className="text-white/70 text-sm">IFC bestanden en data beheren</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoek op merk..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".ifc"
            onChange={handleFileUpload}
          />
          <Button 
            className="gap-2 bg-emerald-600 hover:bg-emerald-700" 
            onClick={handleUploadClick}
            disabled={isLoading || !ifcApi}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {isLoading ? "Verwerken..." : "IFC Uploaden"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileBox className="w-5 h-5" />
                  IFC Data
                </CardTitle>
                <CardDescription>
                  {fileName
                    ? `${fileName} - ${filteredData.length} van ${data.length} elementen`
                    : "Upload een IFC bestand om elementen te extraheren"}
                </CardDescription>
              </div>
              {fileName && (
                <Button variant="ghost" size="sm" onClick={handleClearData} className="text-muted-foreground">
                  <X className="w-4 h-4 mr-1" />
                  Wissen
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {data.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileBox className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nog geen IFC bestand geüpload</p>
                <p className="text-sm mt-1">Upload een .ifc bestand om elementen te extraheren</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Merk</TableHead>
                      <TableHead>Bouwblok</TableHead>
                      <TableHead>Bouwdeel</TableHead>
                      <TableHead>Bouwlaag</TableHead>
                      <TableHead>Breedte</TableHead>
                      <TableHead>Hoogte</TableHead>
                      <TableHead>Project X</TableHead>
                      <TableHead>Project Y</TableHead>
                      <TableHead>Project Z</TableHead>
                      <TableHead>Rotatie X</TableHead>
                      <TableHead>Rotatie Y</TableHead>
                      <TableHead>Rotatie Z</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row.merk}</TableCell>
                        <TableCell>{row.bouwblok}</TableCell>
                        <TableCell>{row.bouwdeel}</TableCell>
                        <TableCell>{row.bouwlaag}</TableCell>
                        <TableCell>{row.breedte}</TableCell>
                        <TableCell>{row.hoogte}</TableCell>
                        <TableCell>{row.projectX}</TableCell>
                        <TableCell>{row.projectY}</TableCell>
                        <TableCell>{row.projectZ}</TableCell>
                        <TableCell>{row.rotatieX}</TableCell>
                        <TableCell>{row.rotatieY}</TableCell>
                        <TableCell>{row.rotatieZ}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TifaIFC;
