import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type DepartmentType = 'algemeen' | 'tifa' | 'panelen' | 'units' | 'mycuby';
export type ContactType = 'klant' | 'leverancier' | 'partner' | 'prospect';
export type LeadStatus = 'nieuw' | 'gekwalificeerd' | 'offerte' | 'onderhandeling' | 'gewonnen' | 'verloren';

export interface Company {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  notes: string | null;
  department: DepartmentType;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  job_title: string | null;
  company_id: string | null;
  contact_type: ContactType;
  department: DepartmentType;
  notes: string | null;
  created_at: string;
  updated_at: string;
  company?: Company;
}

export interface Lead {
  id: string;
  title: string;
  description: string | null;
  value: number | null;
  status: LeadStatus;
  probability: number | null;
  contact_id: string | null;
  company_id: string | null;
  department: DepartmentType;
  expected_close_date: string | null;
  closed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  contact?: Contact;
  company?: Company;
}

export interface CRMActivity {
  id: string;
  type: string;
  subject: string;
  description: string | null;
  contact_id: string | null;
  company_id: string | null;
  lead_id: string | null;
  department: DepartmentType;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export function useCRM(department?: DepartmentType) {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch companies
      let companyQuery = supabase.from('companies').select('*').order('name');
      if (department && department !== 'algemeen') {
        companyQuery = companyQuery.eq('department', department);
      }
      const { data: companiesData } = await companyQuery;
      setCompanies(companiesData || []);

      // Fetch contacts with company
      let contactQuery = supabase.from('contacts').select('*, company:companies(*)').order('last_name');
      if (department && department !== 'algemeen') {
        contactQuery = contactQuery.eq('department', department);
      }
      const { data: contactsData } = await contactQuery;
      setContacts(contactsData || []);

      // Fetch leads with contact and company
      let leadQuery = supabase.from('leads').select('*, contact:contacts(*), company:companies(*)').order('created_at', { ascending: false });
      if (department && department !== 'algemeen') {
        leadQuery = leadQuery.eq('department', department);
      }
      const { data: leadsData } = await leadQuery;
      setLeads(leadsData || []);

      // Fetch activities
      let activityQuery = supabase.from('crm_activities').select('*').order('created_at', { ascending: false }).limit(50);
      if (department && department !== 'algemeen') {
        activityQuery = activityQuery.eq('department', department);
      }
      const { data: activitiesData } = await activityQuery;
      setActivities(activitiesData || []);
    } catch (error) {
      console.error('Error fetching CRM data:', error);
      toast({ title: 'Fout bij ophalen data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [department]);

  // Company CRUD
  const addCompany = async (company: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase.from('companies').insert(company).select().single();
    if (error) {
      toast({ title: 'Fout bij toevoegen bedrijf', variant: 'destructive' });
      return null;
    }
    setCompanies(prev => [...prev, data]);
    toast({ title: 'Bedrijf toegevoegd' });
    return data;
  };

  const updateCompany = async (id: string, updates: Partial<Company>) => {
    const { error } = await supabase.from('companies').update(updates).eq('id', id);
    if (error) {
      toast({ title: 'Fout bij bijwerken bedrijf', variant: 'destructive' });
      return false;
    }
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    toast({ title: 'Bedrijf bijgewerkt' });
    return true;
  };

  const deleteCompany = async (id: string) => {
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) {
      toast({ title: 'Fout bij verwijderen bedrijf', variant: 'destructive' });
      return false;
    }
    setCompanies(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Bedrijf verwijderd' });
    return true;
  };

  // Contact CRUD
  const addContact = async (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'company'>) => {
    const { data, error } = await supabase.from('contacts').insert(contact).select('*, company:companies(*)').single();
    if (error) {
      toast({ title: 'Fout bij toevoegen contact', variant: 'destructive' });
      return null;
    }
    setContacts(prev => [...prev, data]);
    toast({ title: 'Contact toegevoegd' });
    return data;
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    const { error } = await supabase.from('contacts').update(updates).eq('id', id);
    if (error) {
      toast({ title: 'Fout bij bijwerken contact', variant: 'destructive' });
      return false;
    }
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    toast({ title: 'Contact bijgewerkt' });
    return true;
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (error) {
      toast({ title: 'Fout bij verwijderen contact', variant: 'destructive' });
      return false;
    }
    setContacts(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Contact verwijderd' });
    return true;
  };

  // Lead CRUD
  const addLead = async (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'contact' | 'company'>) => {
    const { data, error } = await supabase.from('leads').insert(lead).select('*, contact:contacts(*), company:companies(*)').single();
    if (error) {
      toast({ title: 'Fout bij toevoegen lead', variant: 'destructive' });
      return null;
    }
    setLeads(prev => [data, ...prev]);
    toast({ title: 'Lead toegevoegd' });
    return data;
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    const { error } = await supabase.from('leads').update(updates).eq('id', id);
    if (error) {
      toast({ title: 'Fout bij bijwerken lead', variant: 'destructive' });
      return false;
    }
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    toast({ title: 'Lead bijgewerkt' });
    return true;
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      toast({ title: 'Fout bij verwijderen lead', variant: 'destructive' });
      return false;
    }
    setLeads(prev => prev.filter(l => l.id !== id));
    toast({ title: 'Lead verwijderd' });
    return true;
  };

  // Activity CRUD
  const addActivity = async (activity: Omit<CRMActivity, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('crm_activities').insert(activity).select().single();
    if (error) {
      toast({ title: 'Fout bij toevoegen activiteit', variant: 'destructive' });
      return null;
    }
    setActivities(prev => [data, ...prev]);
    toast({ title: 'Activiteit toegevoegd' });
    return data;
  };

  // Statistics
  const stats = {
    totalCompanies: companies.length,
    totalContacts: contacts.length,
    totalLeads: leads.length,
    openLeads: leads.filter(l => !['gewonnen', 'verloren'].includes(l.status)).length,
    wonLeads: leads.filter(l => l.status === 'gewonnen').length,
    totalValue: leads.reduce((sum, l) => sum + (l.value || 0), 0),
    wonValue: leads.filter(l => l.status === 'gewonnen').reduce((sum, l) => sum + (l.value || 0), 0),
  };

  return {
    companies,
    contacts,
    leads,
    activities,
    loading,
    stats,
    refetch: fetchData,
    addCompany,
    updateCompany,
    deleteCompany,
    addContact,
    updateContact,
    deleteContact,
    addLead,
    updateLead,
    deleteLead,
    addActivity,
  };
}
