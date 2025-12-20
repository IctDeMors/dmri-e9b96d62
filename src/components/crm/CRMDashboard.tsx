import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, TrendingUp, Euro, Target, CheckCircle } from 'lucide-react';
import { useCRM, DepartmentType } from '@/hooks/useCRM';

interface CRMDashboardProps {
  department?: DepartmentType;
}

export function CRMDashboard({ department }: CRMDashboardProps) {
  const { stats, loading } = useCRM(department);

  const cards = [
    {
      title: 'Bedrijven',
      value: stats.totalCompanies,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Contacten',
      value: stats.totalContacts,
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Open Leads',
      value: stats.openLeads,
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Gewonnen Leads',
      value: stats.wonLeads,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Pipeline Waarde',
      value: `€${stats.totalValue.toLocaleString('nl-NL')}`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Gewonnen Waarde',
      value: `€${stats.wonValue.toLocaleString('nl-NL')}`,
      icon: Euro,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
