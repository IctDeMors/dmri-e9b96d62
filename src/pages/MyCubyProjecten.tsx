import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Edit, FolderOpen, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export interface BathroomModel {
  id: string;
  name: string;
  type: string;
  breedte: string;
  diepte: string;
  hoogte: string;
  heeftDouche: boolean;
  heeftToilet: boolean;
  heeftBadmeubel: boolean;
  kleurlijn: "blackline" | "blanc_oak" | "white_oak" | "";
  notes: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  klant: string;
  status: "concept" | "in_productie" | "afgerond" | "on_hold";
  leverdatum: string;
  bathroomModels: BathroomModel[];
  createdAt: string;
  updatedAt: string;
}

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

const MyCubyProjecten = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    description: "", 
    klant: "", 
    status: "concept" as Project["status"], 
    leverdatum: "" 
  });
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setProjects(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsDialogOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const saveProjects = (newProjects: Project[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProjects));
    setProjects(newProjects);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ title: "Fout", description: "Projectnaam is verplicht", variant: "destructive" });
      return;
    }

    const now = new Date().toISOString();

    if (editingProject) {
      const updated = projects.map((p) =>
        p.id === editingProject.id
          ? { 
              ...p, 
              name: formData.name, 
              description: formData.description, 
              klant: formData.klant,
              status: formData.status,
              leverdatum: formData.leverdatum,
              updatedAt: now 
            }
          : p
      );
      saveProjects(updated);
      toast({ title: "Succes", description: "Project bijgewerkt" });
    } else {
      const newProject: Project = {
        id: crypto.randomUUID(),
        name: formData.name,
        description: formData.description,
        klant: formData.klant,
        status: formData.status,
        leverdatum: formData.leverdatum,
        bathroomModels: [],
        createdAt: now,
        updatedAt: now,
      };
      saveProjects([...projects, newProject]);
      toast({ title: "Succes", description: "Project aangemaakt" });
    }

    setFormData({ name: "", description: "", klant: "", status: "concept", leverdatum: "" });
    setEditingProject(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({ 
      name: project.name, 
      description: project.description,
      klant: project.klant || "",
      status: project.status || "concept",
      leverdatum: project.leverdatum || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    saveProjects(updated);
    toast({ title: "Verwijderd", description: "Project verwijderd" });
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setFormData({ name: "", description: "", klant: "", status: "concept", leverdatum: "" });
      setEditingProject(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/mycuby" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Projecten</h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuw Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingProject ? "Project Bewerken" : "Nieuw Project"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Projectnaam *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Voer projectnaam in"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="klant">Klant</Label>
                      <Input
                        id="klant"
                        value={formData.klant}
                        onChange={(e) => setFormData({ ...formData, klant: e.target.value })}
                        placeholder="Klantnaam"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as Project["status"] })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="concept">Concept</SelectItem>
                          <SelectItem value="in_productie">In Productie</SelectItem>
                          <SelectItem value="afgerond">Afgerond</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leverdatum">Leverdatum</Label>
                      <Input
                        id="leverdatum"
                        type="date"
                        value={formData.leverdatum}
                        onChange={(e) => setFormData({ ...formData, leverdatum: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Omschrijving</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optionele omschrijving"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                      Annuleren
                    </Button>
                    <Button type="submit">{editingProject ? "Opslaan" : "Aanmaken"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nog geen projecten. Maak je eerste project aan!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="border-border hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/mycuby/projecten/${project.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      {project.klant && <p className="text-sm text-muted-foreground">Klant: {project.klant}</p>}
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/mycuby/projecten/${project.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(project)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(project.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{project.description || "Geen omschrijving"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={statusColors[project.status || "concept"]}>{statusLabels[project.status || "concept"]}</Badge>
                    {project.leverdatum && (
                      <span className="text-xs text-muted-foreground">
                        Levering: {new Date(project.leverdatum).toLocaleDateString("nl-NL")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {project.bathroomModels?.length || 0} badkamer model(len)
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyCubyProjecten;
