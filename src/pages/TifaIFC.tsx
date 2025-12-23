import { Link } from "react-router-dom";
import { ArrowLeft, FileBox, Upload, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const TifaIFC = () => {
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
              placeholder="Zoek in IFC bestanden..." 
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Upload className="w-4 h-4" />
            Uploaden
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileBox className="w-5 h-5" />
              IFC Bestanden
            </CardTitle>
            <CardDescription>
              Beheer en bekijk IFC bestanden en bijbehorende data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <FileBox className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nog geen IFC bestanden geüpload</p>
              <p className="text-sm mt-1">Upload een IFC bestand om te beginnen</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TifaIFC;
