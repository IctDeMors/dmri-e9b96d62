import { useState } from 'react';
import { useCRM, DepartmentType, CRMActivity } from '@/hooks/useCRM';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Phone, Mail, Calendar, Users, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ActivitiesTableProps {
  department: DepartmentType;
}

const ACTIVITY_TYPES = [
  { value: 'call', label: 'Telefoongesprek', icon: Phone },
  { value: 'email', label: 'E-mail', icon: Mail },
  { value: 'meeting', label: 'Meeting', icon: Users },
  { value: 'follow_up', label: 'Follow-up', icon: Calendar },
  { value: 'task', label: 'Taak', icon: Clock },
];

export function ActivitiesTable({ department }: ActivitiesTableProps) {
  const { activities, contacts, companies, leads, addActivity, refetch, loading } = useCRM(department);
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'call',
    subject: '',
    description: '',
    contact_id: '',
    company_id: '',
    lead_id: '',
    due_date: '',
  });

  const filteredActivities = activities.filter(activity =>
    activity.subject.toLowerCase().includes(search.toLowerCase()) ||
    activity.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addActivity({
      ...formData,
      contact_id: formData.contact_id || null,
      company_id: formData.company_id || null,
      lead_id: formData.lead_id || null,
      due_date: formData.due_date || null,
      completed_at: null,
      department,
    });
    setFormData({
      type: 'call',
      subject: '',
      description: '',
      contact_id: '',
      company_id: '',
      lead_id: '',
      due_date: '',
    });
    setDialogOpen(false);
  };

  const toggleComplete = async (activity: CRMActivity) => {
    const { error } = await supabase
      .from('crm_activities')
      .update({
        completed_at: activity.completed_at ? null : new Date().toISOString(),
      })
      .eq('id', activity.id);
    
    if (error) {
      toast({ title: 'Fout bij bijwerken activiteit', variant: 'destructive' });
    } else {
      toast({ title: activity.completed_at ? 'Activiteit heropend' : 'Activiteit afgerond' });
      refetch();
    }
  };

  const deleteActivity = async (id: string) => {
    const { error } = await supabase.from('crm_activities').delete().eq('id', id);
    if (error) {
      toast({ title: 'Fout bij verwijderen activiteit', variant: 'destructive' });
    } else {
      toast({ title: 'Activiteit verwijderd' });
      refetch();
    }
  };

  const getActivityIcon = (type: string) => {
    const activityType = ACTIVITY_TYPES.find(t => t.value === type);
    return activityType?.icon || Clock;
  };

  const getActivityLabel = (type: string) => {
    const activityType = ACTIVITY_TYPES.find(t => t.value === type);
    return activityType?.label || type;
  };

  const getContactName = (contactId: string | null) => {
    if (!contactId) return null;
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.first_name} ${contact.last_name}` : null;
  };

  const getCompanyName = (companyId: string | null) => {
    if (!companyId) return null;
    const company = companies.find(c => c.id === companyId);
    return company?.name || null;
  };

  const getLeadTitle = (leadId: string | null) => {
    if (!leadId) return null;
    const lead = leads.find(l => l.id === leadId);
    return lead?.title || null;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8">Laden...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Activiteiten</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Zoeken..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nieuwe activiteit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nieuwe activiteit</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTIVITY_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Deadline</Label>
                      <Input
                        type="datetime-local"
                        value={formData.due_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Onderwerp *</Label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Omschrijving</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contact</Label>
                      <Select
                        value={formData.contact_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, contact_id: value === 'none' ? '' : value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer contact" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Geen</SelectItem>
                          {contacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.first_name} {contact.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Bedrijf</Label>
                      <Select
                        value={formData.company_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, company_id: value === 'none' ? '' : value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer bedrijf" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Geen</SelectItem>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Lead</Label>
                    <Select
                      value={formData.lead_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, lead_id: value === 'none' ? '' : value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer lead" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Geen</SelectItem>
                        {leads.map((lead) => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Annuleren
                    </Button>
                    <Button type="submit">Toevoegen</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Status</TableHead>
              <TableHead className="w-32">Type</TableHead>
              <TableHead>Onderwerp</TableHead>
              <TableHead>Gekoppeld aan</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Aangemaakt</TableHead>
              <TableHead className="w-20">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredActivities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Geen activiteiten gevonden
                </TableCell>
              </TableRow>
            ) : (
              filteredActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                const isCompleted = !!activity.completed_at;
                const isPastDue = activity.due_date && new Date(activity.due_date) < new Date() && !isCompleted;
                
                return (
                  <TableRow key={activity.id} className={isCompleted ? 'opacity-60' : ''}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleComplete(activity)}
                        className={isCompleted ? 'text-green-600' : 'text-muted-foreground'}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Icon className="w-3 h-3" />
                        {getActivityLabel(activity.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={isCompleted ? 'line-through' : ''}>
                        <p className="font-medium">{activity.subject}</p>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {activity.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {getContactName(activity.contact_id) && (
                          <p>👤 {getContactName(activity.contact_id)}</p>
                        )}
                        {getCompanyName(activity.company_id) && (
                          <p>🏢 {getCompanyName(activity.company_id)}</p>
                        )}
                        {getLeadTitle(activity.lead_id) && (
                          <p>📈 {getLeadTitle(activity.lead_id)}</p>
                        )}
                        {!activity.contact_id && !activity.company_id && !activity.lead_id && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {activity.due_date ? (
                        <span className={isPastDue ? 'text-destructive font-medium' : ''}>
                          {format(new Date(activity.due_date), 'dd MMM yyyy HH:mm', { locale: nl })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(activity.created_at), 'dd MMM yyyy', { locale: nl })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteActivity(activity.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
