import { useState } from "react";
import { UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onDataLoaded: (data: any[], columns: string[]) => void;
}

const FileUpload = ({ onDataLoaded }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim());
    const data = lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim());
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index];
      });
      return obj;
    });
    return { data, columns: headers };
  };

  const parseJSON = (text: string) => {
    const json = JSON.parse(text);
    const data = Array.isArray(json) ? json : [json];
    const columns = data.length > 0 ? Object.keys(data[0]) : [];
    return { data, columns };
  };

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      let result;

      if (file.name.endsWith(".csv")) {
        result = parseCSV(text);
      } else if (file.name.endsWith(".json")) {
        result = parseJSON(text);
      } else {
        toast({
          title: "Ongeldig bestandstype",
          description: "Upload een CSV of JSON bestand",
          variant: "destructive",
        });
        return;
      }

      onDataLoaded(result.data, result.columns);
      toast({
        title: "Succes!",
        description: `${result.data.length} rijen geladen`,
      });
    } catch (error) {
      toast({
        title: "Fout bij laden",
        description: "Kon het bestand niet verwerken",
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <Card className="p-8">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        <UploadIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Upload je data bestand</h3>
        <p className="text-muted-foreground mb-4">
          Sleep een CSV of JSON bestand hierheen of klik om te selecteren
        </p>
        <input
          type="file"
          accept=".csv,.json"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button asChild>
            <span>Bestand Selecteren</span>
          </Button>
        </label>
      </div>
    </Card>
  );
};

export default FileUpload;
