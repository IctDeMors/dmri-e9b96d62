import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ApiConfigProps {
  onDataLoaded: (data: any[], columns: string[]) => void;
}

const ApiConfig = ({ onDataLoaded }: ApiConfigProps) => {
  const [apiUrl, setApiUrl] = useState("http://localhost:3000/api/data");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error("API request mislukt");
      
      const json = await response.json();
      const data = Array.isArray(json) ? json : [json];
      const columns = data.length > 0 ? Object.keys(data[0]) : [];
      
      onDataLoaded(data, columns);
      toast({
        title: "Succes!",
        description: `${data.length} rijen geladen van API`,
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon geen verbinding maken met de API. Zorg dat je lokale server draait.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Lokale API Configuratie</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Verbind met een lokale API endpoint die je SQL data terugstuurt als JSON
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="api-url">API Endpoint URL</Label>
          <Input
            id="api-url"
            type="url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://localhost:3000/api/data"
          />
          <p className="text-xs text-muted-foreground">
            Voorbeeld: http://localhost:3000/api/data
          </p>
        </div>

        <Button onClick={fetchData} disabled={isLoading} className="w-full">
          {isLoading ? "Laden..." : "Data Ophalen"}
        </Button>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2 text-sm">Voorbeeld API Response:</h4>
          <pre className="text-xs overflow-auto">
{`[
  {
    "id": 1,
    "naam": "Product A",
    "prijs": 29.99
  },
  {
    "id": 2,
    "naam": "Product B",
    "prijs": 49.99
  }
]`}
          </pre>
        </div>
      </div>
    </Card>
  );
};

export default ApiConfig;
