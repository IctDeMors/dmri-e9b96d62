import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Trash2, Edit, Bath, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import type { Project, BathroomModel } from "./MyCubyProjecten";

const STORAGE_KEY = "mycuby-projects";

const statusLabels = {
  concept: "Concept",
  in_productie: "In Productie",
  afgerond: "Afgerond",
  on_hold: "On Hold",
};

const statusColors = {
  concept: "bg-blue-500/20 text-blue-700",
  in_productie: "bg-yellow-500/20 text-yellow-700",
  afgerond: "bg-green-500/20 text-green-700",
  on_hold: "bg-muted text-muted-foreground",
};

const kleurlijnLabels = {
  blackline: "Blackline",
  blanc_oak: "Blanc Oak",
  white_oak: "White Oak",
};

const MyCubyProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<BathroomModel | null>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    type: "", 
    breedte: "", 
    diepte: "", 
    hoogte: "", 
    heeftDouche: false, 
    heeftToilet: false, 
    heeftBadmeubel: false, 
    kleurlijn: "" as BathroomModel["kleurlijn"],
    notes: "" 
  });
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const projects: Project[] = JSON.parse(stored);
      const found = projects.find((p) => p.id === projectId);
      if (found) {
        setProject(found);
      } else {
        navigate("/mycuby/projecten");
      }
    }
  }, [projectId, navigate]);

  const saveProject = (updatedProject: Project) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const projects: Project[] = JSON.parse(stored);
      const updated = projects.map((p) => (p.id === updatedProject.id ? updatedProject : p));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setProject(updatedProject);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    if (!formData.name.trim()) {
      toast({ title: "Fout", description: "Model naam is verplicht", variant: "destructive" });
      return;
    }

    const now = new Date().toISOString();
    let updatedModels: BathroomModel[];

    if (editingModel) {
      updatedModels = project.bathroomModels.map((m) =>
        m.id === editingModel.id
          ? { 
              ...m, 
              name: formData.name, 
              type: formData.type, 
              breedte: formData.breedte,
              diepte: formData.diepte,
              hoogte: formData.hoogte,
              heeftDouche: formData.heeftDouche,
              heeftToilet: formData.heeftToilet,
              heeftBadmeubel: formData.heeftBadmeubel,
              kleurlijn: formData.kleurlijn,
              notes: formData.notes 
            }
          : m
      );
      toast({ title: "Succes", description: "Badkamer model bijgewerkt" });
    } else {
      const newModel: BathroomModel = {
        id: crypto.randomUUID(),
        name: formData.name,
        type: formData.type,
        breedte: formData.breedte,
        diepte: formData.diepte,
        hoogte: formData.hoogte,
        heeftDouche: formData.heeftDouche,
        heeftToilet: formData.heeftToilet,
        heeftBadmeubel: formData.heeftBadmeubel,
        kleurlijn: formData.kleurlijn,
        notes: formData.notes,
      };
      updatedModels = [...project.bathroomModels, newModel];
      toast({ title: "Succes", description: "Badkamer model toegevoegd" });
    }

    saveProject({ ...project, bathroomModels: updatedModels, updatedAt: now });
    setFormData({ name: "", type: "", breedte: "", diepte: "", hoogte: "", heeftDouche: false, heeftToilet: false, heeftBadmeubel: false, kleurlijn: "", notes: "" });
    setEditingModel(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (model: BathroomModel) => {
    setEditingModel(model);
    setFormData({ 
      name: model.name, 
      type: model.type, 
      breedte: model.breedte || "",
      diepte: model.diepte || "",
      hoogte: model.hoogte || "",
      heeftDouche: model.heeftDouche || false,
      heeftToilet: model.heeftToilet || false,
      heeftBadmeubel: model.heeftBadmeubel || false,
      kleurlijn: model.kleurlijn || "",
      notes: model.notes 
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (modelId: string) => {
    if (!project) return;
    const updatedModels = project.bathroomModels.filter((m) => m.id !== modelId);
    saveProject({ ...project, bathroomModels: updatedModels, updatedAt: new Date().toISOString() });
    toast({ title: "Verwijderd", description: "Badkamer model verwijderd" });
  };

  const handleDuplicate = (model: BathroomModel) => {
    if (!project) return;
    const duplicatedModel: BathroomModel = {
      id: crypto.randomUUID(),
      name: `${model.name} (kopie)`,
      type: model.type,
      breedte: model.breedte,
      diepte: model.diepte,
      hoogte: model.hoogte,
      heeftDouche: model.heeftDouche,
      heeftToilet: model.heeftToilet,
      heeftBadmeubel: model.heeftBadmeubel,
      kleurlijn: model.kleurlijn,
      notes: model.notes,
    };
    const updatedModels = [...project.bathroomModels, duplicatedModel];
    saveProject({ ...project, bathroomModels: updatedModels, updatedAt: new Date().toISOString() });
    toast({ title: "Gekopieerd", description: "Badkamer model gedupliceerd" });
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setFormData({ name: "", type: "", breedte: "", diepte: "", hoogte: "", heeftDouche: false, heeftToilet: false, heeftBadmeubel: false, kleurlijn: "", notes: "" });
      setEditingModel(null);
    }
  };

  if (!project) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Laden...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/mycuby/projecten" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
                {project.klant && <p className="text-sm text-muted-foreground">Klant: {project.klant}</p>}
              </div>
            </div>
            <Badge className={statusColors[project.status || "concept"]}>{statusLabels[project.status || "concept"]}</Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Omschrijving:</span>
                <p>{project.description || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Leverdatum:</span>
                <p>{project.leverdatum ? new Date(project.leverdatum).toLocaleDateString("nl-NL") : "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Aangemaakt:</span>
                <p>{new Date(project.createdAt).toLocaleDateString("nl-NL")}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Laatst gewijzigd:</span>
                <p>{new Date(project.updatedAt).toLocaleDateString("nl-NL")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Bathroom Models Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Badkamer Modellen</CardTitle>
                  <CardDescription>Configureer de badkamer modellen voor dit project</CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nieuw Model
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingModel ? "Model Bewerken" : "Nieuw Badkamer Model"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="modelName">Model Naam *</Label>
                          <Input
                            id="modelName"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="bijv. Standaard badkamer"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="type">Type</Label>
                          <Input
                            id="type"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            placeholder="bijv. Compact, Luxe"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="breedte">Breedte (mm)</Label>
                          <Input
                            id="breedte"
                            value={formData.breedte}
                            onChange={(e) => setFormData({ ...formData, breedte: e.target.value })}
                            placeholder="bijv. 2400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="diepte">Diepte (mm)</Label>
                          <Input
                            id="diepte"
                            value={formData.diepte}
                            onChange={(e) => setFormData({ ...formData, diepte: e.target.value })}
                            placeholder="bijv. 1800"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hoogte">Hoogte (mm)</Label>
                          <Input
                            id="hoogte"
                            value={formData.hoogte}
                            onChange={(e) => setFormData({ ...formData, hoogte: e.target.value })}
                            placeholder="bijv. 2500"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Kleurlijn</Label>
                        <Select value={formData.kleurlijn} onValueChange={(v) => setFormData({ ...formData, kleurlijn: v as BathroomModel["kleurlijn"] })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer kleurlijn" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="blackline">Blackline</SelectItem>
                            <SelectItem value="blanc_oak">Blanc Oak</SelectItem>
                            <SelectItem value="white_oak">White Oak</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label>Onderdelen</Label>
                        <div className="flex flex-wrap gap-6">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="douche" 
                              checked={formData.heeftDouche} 
                              onCheckedChange={(c) => setFormData({ ...formData, heeftDouche: !!c })} 
                            />
                            <Label htmlFor="douche" className="font-normal">Douche</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="toilet" 
                              checked={formData.heeftToilet} 
                              onCheckedChange={(c) => setFormData({ ...formData, heeftToilet: !!c })} 
                            />
                            <Label htmlFor="toilet" className="font-normal">Toilet</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="badmeubel" 
                              checked={formData.heeftBadmeubel} 
                              onCheckedChange={(c) => setFormData({ ...formData, heeftBadmeubel: !!c })} 
                            />
                            <Label htmlFor="badmeubel" className="font-normal">Badmeubel</Label>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notities</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Aanvullende specificaties of opmerkingen"
                          rows={2}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                          Annuleren
                        </Button>
                        <Button type="submit">{editingModel ? "Opslaan" : "Toevoegen"}</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {project.bathroomModels.length === 0 ? (
                <div className="text-center py-8">
                  <Bath className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nog geen badkamer modellen. Voeg je eerste model toe!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.bathroomModels.map((model) => (
                    <Card key={model.id} className="border">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base">{model.name}</CardTitle>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(model)} title="Dupliceren">
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(model)} title="Bewerken">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(model.id)} title="Verwijderen">
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        {model.type && <p><span className="text-muted-foreground">Type:</span> {model.type}</p>}
                        {(model.breedte || model.diepte || model.hoogte) && (
                          <p><span className="text-muted-foreground">Afmetingen:</span> {model.breedte || "-"} x {model.diepte || "-"} x {model.hoogte || "-"} mm</p>
                        )}
                        {model.kleurlijn && <p><span className="text-muted-foreground">Kleurlijn:</span> {kleurlijnLabels[model.kleurlijn]}</p>}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {model.heeftDouche && <Badge variant="secondary" className="text-xs">Douche</Badge>}
                          {model.heeftToilet && <Badge variant="secondary" className="text-xs">Toilet</Badge>}
                          {model.heeftBadmeubel && <Badge variant="secondary" className="text-xs">Badmeubel</Badge>}
                        </div>
                        {model.notes && <p className="text-muted-foreground text-xs mt-2">{model.notes}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default MyCubyProjectDetail;
