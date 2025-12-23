import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileBox, Upload, Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import * as XLSX from "xlsx";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result;
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        if (jsonData.length < 2) {
          toast.error("Het bestand bevat geen data");
          return;
        }

        // Skip header row and map data
        const rows: IFCDataRow[] = jsonData.slice(1).map((row) => ({
          merk: row[0] || "",
          bouwblok: row[1] || "",
          bouwdeel: row[2] || "",
          bouwlaag: row[3] || "",
          breedte: row[4] || "",
          hoogte: row[5] || "",
          projectX: row[6] || "",
          projectY: row[7] || "",
          projectZ: row[8] || "",
          rotatieX: row[9] || "",
          rotatieY: row[10] || "",
          rotatieZ: row[11] || "",
        }));

        setData(rows);
        setFileName(file.name);
        toast.success(`${rows.length} rijen geïmporteerd uit ${file.name}`);
      } catch (error) {
        toast.error("Fout bij het lezen van het bestand");
        console.error(error);
      }
    };
    reader.readAsArrayBuffer(file);
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
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
          />
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleUploadClick}>
            <Upload className="w-4 h-4" />
            Uploaden
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileBox className="w-5 h-5" />
                  IFC Bestanden
                </CardTitle>
                <CardDescription>
                  {fileName
                    ? `${fileName} - ${filteredData.length} van ${data.length} rijen`
                    : "Beheer en bekijk IFC bestanden en bijbehorende data"}
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
                <p>Nog geen IFC bestanden geüpload</p>
                <p className="text-sm mt-1">Upload een Excel bestand om te beginnen</p>
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
