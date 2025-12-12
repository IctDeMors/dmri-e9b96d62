import { useState } from "react";
import { DatabaseIcon, UploadIcon, Settings2Icon, ServerIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataTable from "@/components/DataTable";
import FileUpload from "@/components/FileUpload";
import ApiConfig from "@/components/ApiConfig";
import SqlConfig from "@/components/SqlConfig";
const Index = () => {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const handleDataLoaded = (loadedData: any[], loadedColumns: string[]) => {
    setData(loadedData);
    setColumns(loadedColumns);
  };
  return <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-sidebar-border bg-[#0c3a83]">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <DatabaseIcon className="w-6 h-6 text-sidebar-primary" />
            <h1 className="text-xl font-bold text-sidebar-foreground">SQL Viewer</h1>
          </div>
          <nav className="space-y-2">
            <div className="text-sm text-sidebar-foreground/60 font-medium mb-2">Data Bronnen</div>
            <a href="#" className="block px-3 py-2 rounded-md text-sidebar-accent-foreground bg-[#356bc8]">
              Lokale Data
            </a>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Data Viewer</h2>
            <p className="text-muted-foreground">Importeer je SQL data via CSV, JSON of een lokale API</p>
          </div>

          <Tabs defaultValue="upload" className="space-y-6">
            <TabsList>
              <TabsTrigger value="upload" className="gap-2">
                <UploadIcon className="w-4 h-4" />
                Bestand Uploaden
              </TabsTrigger>
              <TabsTrigger value="api" className="gap-2">
                <Settings2Icon className="w-4 h-4" />
                API Configuratie
              </TabsTrigger>
              <TabsTrigger value="sql" className="gap-2">
                <ServerIcon className="w-4 h-4" />
                SQL Server
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <FileUpload onDataLoaded={handleDataLoaded} />
            </TabsContent>

            <TabsContent value="api" className="space-y-6">
              <ApiConfig onDataLoaded={handleDataLoaded} />
            </TabsContent>

            <TabsContent value="sql" className="space-y-6">
              <SqlConfig onDataLoaded={handleDataLoaded} />
            </TabsContent>
          </Tabs>

          {data.length > 0 && <div className="mt-8">
              <DataTable data={data} columns={columns} />
            </div>}
        </div>
      </main>
    </div>;
};
export default Index;