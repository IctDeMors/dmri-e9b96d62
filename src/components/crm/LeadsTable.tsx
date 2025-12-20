import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, TrendingUp } from 'lucide-react';
import { useCRM, Lead, DepartmentType, LeadStatus } from '@/hooks/useCRM';

interface LeadsTableProps {
  department?: DepartmentType;
}

const emptyLead = {
  title: '',
  description: '',
  value: null as number | null,
  status: 'nieuw' as LeadStatus,
  probability: 0,
  contact_id: null as string | null,
  company_id: null as string | null,
  department: 'algemeen' as DepartmentType,
  expected_close_date: null as string | null,
  closed_at: null as string | null,
  notes: '',
};

const statusColors: Record<LeadStatus, string> = {
  nieuw: 'bg-blue-500/20 text-blue-700',
  gekwalificeerd: 'bg-cyan-500/20 text-cyan-700',
  offerte: 'bg-yellow-500/20 text-yellow-700',
  onderhandeling: 'bg-orange-500/20 text-orange-700',
  gewonnen: 'bg-green-500/20 text-green-700',
  verloren: 'bg-red-500/20 text-red-700',
};

export function LeadsTable({ department }: LeadsTableProps) {
  const { leads, contacts, companies, loading, addLead, updateLead, deleteLead } = useCRM(department);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState(emptyLead);

  const filteredLeads = leads.filter(l =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.company?.name.toLowerCase().includes(search.toLowerCase()) ||
    l.contact?.first_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      department: department || formData.department,
      contact_id: formData.contact_id || null,
      company_id: formData.company_id || null,
      closed_at: ['gewonnen', 'verloren'].includes(formData.status) ? new Date().toISOString() : null,
    };
    
    if (editingLead) {
      await updateLead(editingLead.id, data);
    } else {
      await addLead(data);
    }
    setIsOpen(false);
    setEditingLead(null);
    setFormData(emptyLead);
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      title: lead.title,
      description: lead.description || '',
      value: lead.value,
      status: lead.status,
      probability: lead.probability || 0,
      contact_id: lead.contact_id,
      company_id: lead.company_id,
      department: lead.department,
      expected_close_date: lead.expected_close_date,
      closed_at: lead.closed_at,
      notes: lead.notes || '',
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Weet je zeker dat je deze lead wilt verwijderen?')) {
      await deleteLead(id);
    }
  };

  const statuses: { value: LeadStatus; label: string }[] = [
    { value: 'nieuw', label: 'Nieuw' },
    { value: 'gekwalificeerd', label: 'Gekwalificeerd' },
    { value: 'offerte', label: 'Offerte' },
    { value: 'onderhandeling', label: 'Onderhandeling' },
    { value: 'gewonnen', label: 'Gewonnen' },
    { value: 'verloren', label: 'Verloren' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingLead(null);
            setFormData(emptyLead);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingLead ? 'Lead Bewerken' : 'Nieuwe Lead'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title">Titel *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="value">Waarde (€)</Label>
                  <Input
                    id="value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.value || ''}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value ? parseFloat(e.target.value) : null })}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as LeadStatus })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="probability">Kans (%)</Label>
                  <Input
                    id="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="expected_close_date">Verwachte Sluitdatum</Label>
                  <Input
                    id="expected_close_date"
                    type="date"
                    value={formData.expected_close_date || ''}
                    onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value || null })}
                  />
                </div>
                <div>
                  <Label htmlFor="contact">Contact</Label>
                  <Select value={formData.contact_id || 'none'} onValueChange={(v) => setFormData({ ...formData, contact_id: v === 'none' ? null : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer contact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Geen contact</SelectItem>
                      {contacts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="company">Bedrijf</Label>
                  <Select value={formData.company_id || 'none'} onValueChange={(v) => setFormData({ ...formData, company_id: v === 'none' ? null : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer bedrijf" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Geen bedrijf</SelectItem>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!department && (
                  <div>
                    <Label htmlFor="department">Afdeling</Label>
                    <Select value={formData.department} onValueChange={(v) => setFormData({ ...formData, department: v as DepartmentType })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="algemeen">Algemeen</SelectItem>
                        <SelectItem value="tifa">Tifa</SelectItem>
                        <SelectItem value="panelen">Panelen</SelectItem>
                        <SelectItem value="units">Units</SelectItem>
                        <SelectItem value="mycuby">myCUBY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="col-span-2">
                  <Label htmlFor="description">Beschrijving</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Notities</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit">
                  {editingLead ? 'Opslaan' : 'Toevoegen'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Laden...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Geen leads gevonden</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titel</TableHead>
                <TableHead>Bedrijf / Contact</TableHead>
                <TableHead>Waarde</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Kans</TableHead>
                {!department && <TableHead>Afdeling</TableHead>}
                <TableHead className="w-24">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.title}</TableCell>
                  <TableCell>
                    <div>
                      {lead.company?.name || '-'}
                      {lead.contact && (
                        <div className="text-sm text-muted-foreground">
                          {lead.contact.first_name} {lead.contact.last_name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {lead.value ? `€${lead.value.toLocaleString('nl-NL')}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[lead.status]} variant="secondary">
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{lead.probability}%</TableCell>
                  {!department && <TableCell className="capitalize">{lead.department}</TableCell>}
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(lead)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(lead.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
