import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Search, Users } from 'lucide-react';
import { useCRM, Contact, DepartmentType, ContactType } from '@/hooks/useCRM';

interface ContactsTableProps {
  department?: DepartmentType;
}

const emptyContact = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  mobile: '',
  job_title: '',
  company_id: null as string | null,
  contact_type: 'klant' as ContactType,
  department: 'algemeen' as DepartmentType,
  notes: '',
};

export function ContactsTable({ department }: ContactsTableProps) {
  const { contacts, companies, loading, addContact, updateContact, deleteContact } = useCRM(department);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState(emptyContact);

  const filteredContacts = contacts.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      department: department || formData.department,
      company_id: formData.company_id || null,
    };
    
    if (editingContact) {
      await updateContact(editingContact.id, data);
    } else {
      await addContact(data);
    }
    setIsOpen(false);
    setEditingContact(null);
    setFormData(emptyContact);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email || '',
      phone: contact.phone || '',
      mobile: contact.mobile || '',
      job_title: contact.job_title || '',
      company_id: contact.company_id,
      contact_type: contact.contact_type,
      department: contact.department,
      notes: contact.notes || '',
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Weet je zeker dat je dit contact wilt verwijderen?')) {
      await deleteContact(id);
    }
  };

  const contactTypes: { value: ContactType; label: string }[] = [
    { value: 'klant', label: 'Klant' },
    { value: 'leverancier', label: 'Leverancier' },
    { value: 'partner', label: 'Partner' },
    { value: 'prospect', label: 'Prospect' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek contacten..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingContact(null);
            setFormData(emptyContact);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nieuw Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingContact ? 'Contact Bewerken' : 'Nieuw Contact'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Voornaam *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Achternaam *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefoon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="mobile">Mobiel</Label>
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="job_title">Functie</Label>
                  <Input
                    id="job_title"
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  />
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
                <div>
                  <Label htmlFor="contact_type">Type</Label>
                  <Select value={formData.contact_type} onValueChange={(v) => setFormData({ ...formData, contact_type: v as ContactType })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contactTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
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
                  <Label htmlFor="notes">Notities</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit">
                  {editingContact ? 'Opslaan' : 'Toevoegen'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Laden...</div>
      ) : filteredContacts.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Geen contacten gevonden</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefoon</TableHead>
                <TableHead>Bedrijf</TableHead>
                <TableHead>Type</TableHead>
                {!department && <TableHead>Afdeling</TableHead>}
                <TableHead className="w-24">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.first_name} {contact.last_name}</TableCell>
                  <TableCell>{contact.email || '-'}</TableCell>
                  <TableCell>{contact.phone || contact.mobile || '-'}</TableCell>
                  <TableCell>{contact.company?.name || '-'}</TableCell>
                  <TableCell className="capitalize">{contact.contact_type}</TableCell>
                  {!department && <TableCell className="capitalize">{contact.department}</TableCell>}
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(contact)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(contact.id)}>
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
