import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, LayoutDashboard, Building2, Users, TrendingUp } from 'lucide-react';
import { DepartmentType } from '@/hooks/useCRM';
import { CRMDashboard } from './CRMDashboard';
import { CompaniesTable } from './CompaniesTable';
import { ContactsTable } from './ContactsTable';
import { LeadsTable } from './LeadsTable';

interface CRMPageProps {
  department: DepartmentType;
  title: string;
  backPath: string;
  headerColor?: string;
}

export function CRMPage({ department, title, backPath, headerColor = 'bg-[#0c3a83]' }: CRMPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className={`border-b border-border ${headerColor}`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Link to={backPath}>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 -ml-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">{title} - CRM</h1>
              <p className="text-white/70 text-sm">Beheer klanten, contacten en leads</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
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

          <TabsContent value="dashboard">
            <CRMDashboard department={department} />
          </TabsContent>

          <TabsContent value="companies">
            <CompaniesTable department={department} />
          </TabsContent>

          <TabsContent value="contacts">
            <ContactsTable department={department} />
          </TabsContent>

          <TabsContent value="leads">
            <LeadsTable department={department} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
