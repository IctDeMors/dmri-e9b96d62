import { Link } from "react-router-dom";
import { Building2, Layers, Box, Cpu, Home, LogOut, Settings, Users, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import demorsLogo from "@/assets/demors-logo.png";

const departments = [
  {
    id: "algemeen",
    name: "Algemeen",
    description: "Algemene data en rapportages",
    icon: Home,
    path: "/algemeen",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    id: "tifa",
    name: "Tifa",
    description: "Tifa afdeling data",
    icon: Building2,
    path: "/tifa",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "panelen",
    name: "Panelen",
    description: "Panelen productie en data",
    icon: Layers,
    path: "/panelen",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  {
    id: "units",
    name: "Units",
    description: "Units beheer en overzicht",
    icon: Box,
    path: "/units",
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  {
    id: "mycuby",
    name: "myCUBY",
    description: "myCUBY platform data",
    icon: Cpu,
    path: "/mycuby",
    color: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  },
];

const HomePage = () => {
  const { user, profile, isAdmin, signOut, hasDepartmentAccess } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Fout bij uitloggen',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Uitgelogd',
        description: 'Je bent succesvol uitgelogd.',
      });
    }
  };

  // Filter departments based on user access
  const accessibleDepartments = departments.filter(dept => 
    hasDepartmentAccess(dept.id as 'algemeen' | 'tifa' | 'panelen' | 'units' | 'mycuby')
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-[#0c3a83]">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <img src={demorsLogo} alt="De Mors" className="h-12" />
          
          <div className="flex items-center gap-4">
            <div className="text-white text-sm text-right hidden sm:block">
              <div className="font-medium">{profile?.full_name || user?.email}</div>
              <div className="text-white/70 text-xs flex items-center gap-1 justify-end">
                {isAdmin && <Shield className="h-3 w-3" />}
                {isAdmin ? 'Administrator' : 'Gebruiker'}
              </div>
            </div>
            
            {isAdmin && (
              <Link to="/gebruikers">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <Users className="h-5 w-5" />
                </Button>
              </Link>
            )}
            
            <Link to="/instellingen">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-3">Welkom bij DMRI</h2>
          <p className="text-muted-foreground text-lg">Selecteer een afdeling om te beginnen</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {accessibleDepartments.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">
                Je hebt nog geen toegang tot afdelingen. Neem contact op met een administrator.
              </p>
            </div>
          ) : (
            accessibleDepartments.map((dept) => (
              <Link key={dept.id} to={dept.path}>
                <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 cursor-pointer">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${dept.color} flex items-center justify-center mb-2`}>
                      <dept.icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl">{dept.name}</CardTitle>
                    <CardDescription>{dept.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-sm text-primary font-medium">Open afdeling →</span>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default HomePage;
