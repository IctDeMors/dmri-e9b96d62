import { Link } from "react-router-dom";
import { ArrowLeft, Users, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CRMDashboard } from "@/components/crm/CRMDashboard";
import { CompaniesTable } from "@/components/crm/CompaniesTable";
import { ContactsTable } from "@/components/crm/ContactsTable";
import { LeadsTable } from "@/components/crm/LeadsTable";
import { NarrowcastManager } from "@/components/narrowcast/NarrowcastManager";
import { LayoutDashboard, Building2, TrendingUp } from "lucide-react";

const Algemeen = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-[#0c3a83]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 -ml-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Algemeen</h1>
              <p className="text-white/70 text-sm">CRM & Narrowcasting</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="narrowcast" className="space-y-6">
          <TabsList>
            <TabsTrigger value="narrowcast" className="gap-2">
              <Tv className="w-4 h-4" />
              Narrowcasting
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              CRM Dashboard
            </TabsTrigger>
            <TabsTrigger value="companies" className="gap-2">
              <Building2 className="w-4 h-4" />
              Bedrijven
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-2">
              <Users className="w-4 h-4" />
              Contacten
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Leads
            </TabsTrigger>
          </TabsList>

          <TabsContent value="narrowcast">
            <NarrowcastManager />
          </TabsContent>

          <TabsContent value="dashboard">
            <CRMDashboard />
          </TabsContent>

          <TabsContent value="companies">
            <CompaniesTable />
          </TabsContent>

          <TabsContent value="contacts">
            <ContactsTable />
          </TabsContent>

          <TabsContent value="leads">
            <LeadsTable />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Algemeen;
