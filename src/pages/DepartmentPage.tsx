import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";

const departmentNames: Record<string, string> = {
  tifa: "Tifa",
  panelen: "Panelen",
  units: "Units",
  mycuby: "myCUBY",
};

const DepartmentPage = () => {
  const { department } = useParams<{ department: string }>();
  const name = departmentNames[department || ""] || department;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-[#0c3a83]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-white">{name}</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center text-center py-20">
          <Construction className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">In ontwikkeling</h2>
          <p className="text-muted-foreground mb-6">
            De {name} afdeling wordt nog gebouwd.
          </p>
          <Link to="/">
            <Button>Terug naar home</Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default DepartmentPage;
