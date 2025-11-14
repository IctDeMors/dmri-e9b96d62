import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface SqlConfigProps {
  onDataLoaded: (data: any[], columns: string[]) => void;
}

const SqlConfig = ({ onDataLoaded }: SqlConfigProps) => {
  const [server, setServer] = useState("localhost");
  const [database, setDatabase] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [query, setQuery] = useState("SELECT * FROM [TableName]");
  const [apiUrl, setApiUrl] = useState("http://localhost:3001/api/sql");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const executeQuery = async () => {
    if (!database || !username || !query) {
      toast({
        title: "Velden ontbreken",
        description: "Vul alle verplichte velden in",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          server,
          database,
          username,
          password,
          query,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "SQL query mislukt");
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
            Verbind met een Microsoft SQL Server database
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="server">Server *</Label>
            <Input
              id="server"
              value={server}
              onChange={(e) => setServer(e.target.value)}
              placeholder="localhost of server.domain.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="database">Database *</Label>
            <Input
              id="database"
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
              placeholder="DatabaseNaam"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="username">Gebruikersnaam *</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="sa of gebruiker"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Wachtwoord</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="query">SQL Query *</Label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SELECT * FROM [TableName]"
            className="w-full min-h-[100px] p-2 border rounded-md bg-background"
          />
        </div>

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

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2 text-sm">Lokale API Setup:</h4>
          <p className="text-xs text-muted-foreground mb-2">
            Je hebt een lokale Node.js API nodig. Bekijk de README voor instructies.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default SqlConfig;
