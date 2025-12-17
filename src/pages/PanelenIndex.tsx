import { Link } from "react-router-dom";
import { ArrowLeft, LayoutDashboard, Calendar, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const pages = [
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Overzicht met statistieken en grafieken",
    icon: LayoutDashboard,
    path: "/panelen/dashboard",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  {
    id: "tijdlijn",
    name: "Tijdlijn",
    description: "Orders weergegeven op een tijdlijn",
    icon: Calendar,
    path: "/panelen/tijdlijn",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    id: "orders",
    name: "Orders Beheren",
    description: "Aanmaken, bewerken en bekijken van orders",
    icon: ClipboardList,
    path: "/panelen/orders",
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
];

const PanelenIndex = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-[#0c3a83]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 -ml-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Panelen</h1>
              <p className="text-white/70 text-sm">Selecteer een weergave</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
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
      </main>
    </div>
  );
};

export default PanelenIndex;
