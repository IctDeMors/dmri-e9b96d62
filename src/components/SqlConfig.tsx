import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SqlConfigProps {
  onDataLoaded: (data: any[], columns: string[]) => void;
}

// Predefined safe queries that match server whitelist
const AVAILABLE_QUERIES = [
  { name: "orders", label: "Orders - Alle orders" },
  { name: "orders_by_date", label: "Orders - Op datum", hasDateParams: true },
  { name: "customers", label: "Klanten - Overzicht" },
  { name: "products", label: "Producten - Overzicht" },
  { name: "tables", label: "Database - Tabellenlijst" },
];

const SqlConfig = ({ onDataLoaded }: SqlConfigProps) => {
  const [selectedQuery, setSelectedQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [apiUrl, setApiUrl] = useState("http://localhost:3001/api/sql");
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const selectedQueryInfo = AVAILABLE_QUERIES.find(q => q.name === selectedQuery);

  const executeQuery = async () => {
    if (!selectedQuery) {
      toast({
        title: "Query ontbreekt",
        description: "Selecteer een query om uit te voeren",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey) {
      toast({
        title: "API Key ontbreekt",
        description: "Voer de API key in voor authenticatie",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Build request with query name and optional parameters
      const requestBody: { queryName: string; parameters?: Record<string, string> } = {
        queryName: selectedQuery,
      };

      // Add date parameters if needed
      if (selectedQueryInfo?.hasDateParams && startDate && endDate) {
        requestBody.parameters = {
          startDate,
          endDate,
        };
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey, // Secure API key authentication
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Query uitvoering mislukt");
      }
      
      const json = await response.json();
      const data = Array.isArray(json.data) ? json.data : [json.data];
      const columns = data.length > 0 ? Object.keys(data[0]) : [];
      
      onDataLoaded(data, columns);
      toast({
        title: "Succes!",
        description: `${data.length} rijen geladen van SQL Server`,
      });
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message || "Kon geen verbinding maken met SQL Server",
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
          <h3 className="text-lg font-semibold mb-2">SQL Server Configuratie</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Voer beveiligde queries uit op de SQL Server database
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="api-key">API Key *</Label>
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Voer je API key in"
          />
          <p className="text-xs text-muted-foreground">
            De API key wordt ingesteld op de server via SQL_API_KEY environment variable
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="query-select">Query *</Label>
          <Select value={selectedQuery} onValueChange={setSelectedQuery}>
            <SelectTrigger>
              <SelectValue placeholder="Selecteer een query" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_QUERIES.map((query) => (
                <SelectItem key={query.name} value={query.name}>
                  {query.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedQueryInfo?.hasDateParams && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Datum</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Eind Datum</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="api-url">Lokale API URL</Label>
          <Input
            id="api-url"
            type="url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://localhost:3001/api/sql"
          />
        </div>

        <Button onClick={executeQuery} disabled={isLoading} className="w-full">
          {isLoading ? "Laden..." : "Query Uitvoeren"}
        </Button>

        <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
          <h4 className="font-medium text-sm">Beveiligde API Setup:</h4>
          <p className="text-xs text-muted-foreground">
            De lokale API vereist de volgende environment variables:
          </p>
          <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
            <li><code>SQL_API_KEY</code> - API key voor authenticatie</li>
            <li><code>SQL_SERVER</code> - SQL Server adres</li>
            <li><code>SQL_DATABASE</code> - Database naam</li>
            <li><code>SQL_USER</code> - Database gebruiker</li>
            <li><code>SQL_PASSWORD</code> - Database wachtwoord</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
            Database credentials worden nooit vanuit de browser verzonden.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default SqlConfig;
