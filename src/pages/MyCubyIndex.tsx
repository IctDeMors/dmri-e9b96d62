import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Plus, ArrowLeft } from "lucide-react";

const menuItems = [
  {
    id: "projecten",
    name: "Projecten",
    description: "Bekijk en beheer je projecten",
    icon: FolderOpen,
    path: "/mycuby/projecten",
  },
  {
    id: "nieuw",
    name: "Nieuw Project",
    description: "Maak een nieuw project aan",
    icon: Plus,
    path: "/mycuby/projecten?new=true",
  },
];

const MyCubyIndex = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">myCUBY</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Link key={item.id} to={item.path}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-border hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default MyCubyIndex;
