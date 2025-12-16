import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bath, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Project, BathroomModel } from "./MyCubyProjecten";

const STORAGE_KEY = "mycuby-projects";

const kleurlijnLabels: Record<string, string> = {
  blackline: "Blackline",
  blanc_oak: "Blanc Oak",
  white_oak: "White Oak",
};

interface ModelWithProject extends BathroomModel {
  projectId: string;
  projectName: string;
  projectKlant: string;
  leverdatum: string | null;
}

const MyCubyModellen = () => {
  const [models, setModels] = useState<ModelWithProject[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const projects: Project[] = JSON.parse(stored);
      const allModels: ModelWithProject[] = [];

      projects.forEach((project) => {
        project.bathroomModels.forEach((model) => {
          allModels.push({
            ...model,
            projectId: project.id,
            projectName: project.name,
            projectKlant: project.klant || "",
            leverdatum: project.leverdatum || null,
          });
        });
      });

      // Sort by leverdatum (null values at the end)
      allModels.sort((a, b) => {
        if (!a.leverdatum && !b.leverdatum) return 0;
        if (!a.leverdatum) return 1;
        if (!b.leverdatum) return -1;
        return new Date(a.leverdatum).getTime() - new Date(b.leverdatum).getTime();
      });

      setModels(allModels);
    }
  }, []);

  const handleExport = (model: ModelWithProject) => {
    const exportData = {
      modelNaam: model.name,
      type: model.type || null,
      afmetingen: {
        breedte: model.breedte || null,
        diepte: model.diepte || null,
        hoogte: model.hoogte || null,
      },
      kleurlijn: model.kleurlijn ? kleurlijnLabels[model.kleurlijn] : null,
      onderdelen: {
        douche: model.heeftDouche || false,
        toilet: model.heeftToilet || false,
        badmeubel: model.heeftBadmeubel || false,
      },
      notities: model.notes || null,
      projectNaam: model.projectName,
      projectKlant: model.projectKlant || null,
      leverdatum: model.leverdatum,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `badkamer-${model.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Geëxporteerd", description: "Badkamer model geëxporteerd als JSON" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/mycuby" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Alle Badkamer Modellen</h1>
              <p className="text-sm text-muted-foreground">Gesorteerd op leverdatum</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {models.length === 0 ? (
          <div className="text-center py-16">
            <Bath className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">Geen badkamer modellen gevonden</p>
            <p className="text-sm text-muted-foreground mt-2">
              Voeg modellen toe via de projecten pagina
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {models.map((model) => (
              <Card key={model.id} className="border-border hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Bath className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-base">{model.name}</CardTitle>
                        <Link
                          to={`/mycuby/projecten/${model.projectId}`}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {model.projectName}
                          {model.projectKlant && ` • ${model.projectKlant}`}
                        </Link>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {model.leverdatum && (
                        <Badge variant="outline">
                          {new Date(model.leverdatum).toLocaleDateString("nl-NL")}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleExport(model)}
                        title="Exporteren"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="flex flex-wrap gap-4">
                    {model.type && (
                      <span>
                        <span className="text-muted-foreground">Type:</span> {model.type}
                      </span>
                    )}
                    {(model.breedte || model.diepte || model.hoogte) && (
                      <span>
                        <span className="text-muted-foreground">Afmetingen:</span>{" "}
                        {model.breedte || "-"} x {model.diepte || "-"} x {model.hoogte || "-"} mm
                      </span>
                    )}
                    {model.kleurlijn && (
                      <span>
                        <span className="text-muted-foreground">Kleurlijn:</span>{" "}
                        {kleurlijnLabels[model.kleurlijn]}
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      {[
                        model.heeftDouche && "Douche",
                        model.heeftToilet && "Toilet",
                        model.heeftBadmeubel && "Badmeubel",
                      ]
                        .filter(Boolean)
                        .join(", ") || "Geen onderdelen"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyCubyModellen;
