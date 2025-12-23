import { Link } from "react-router-dom";
import { ArrowLeft, Users, Construction, FileBox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const pages = [
  {
    id: "crm",
    name: "CRM",
    description: "Klanten, contacten en leads beheren",
    icon: Users,
    path: "/tifa/crm",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "ifc",
    name: "IFC Data",
    description: "IFC bestanden en data beheren",
    icon: FileBox,
    path: "/tifa/ifc",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    id: "ifc-conversie",
    name: "IFC Conversie",
    description: "Unieke kozijnen uit assembly code 31.x",
    icon: RefreshCw,
    path: "/tifa/ifc-conversie",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
];

const TifaIndex = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-emerald-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 -ml-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Tifa</h1>
              <p className="text-white/70 text-sm">Selecteer een weergave</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {pages.map((page) => (
            <Link key={page.id} to={page.path}>
              <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 cursor-pointer">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${page.color} flex items-center justify-center mb-2`}>
                    <page.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">{page.name}</CardTitle>
                  <CardDescription>{page.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm text-primary font-medium">Bekijken →</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex flex-col items-center p-8 rounded-lg bg-muted/50">
            <Construction className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Meer functies komen binnenkort</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TifaIndex;
