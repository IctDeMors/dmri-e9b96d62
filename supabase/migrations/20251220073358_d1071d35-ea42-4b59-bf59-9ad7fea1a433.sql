-- CRM Database Schema

-- Enum for contact types
CREATE TYPE public.contact_type AS ENUM ('klant', 'leverancier', 'partner', 'prospect');

-- Enum for lead status
CREATE TYPE public.lead_status AS ENUM ('nieuw', 'gekwalificeerd', 'offerte', 'onderhandeling', 'gewonnen', 'verloren');

-- Enum for departments
CREATE TYPE public.department_type AS ENUM ('algemeen', 'tifa', 'panelen', 'units', 'mycuby');

-- Bedrijven (Companies/Organizations)
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Nederland',
  notes TEXT,
  department department_type NOT NULL DEFAULT 'algemeen',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contacten (Contacts)
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  job_title TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  contact_type contact_type NOT NULL DEFAULT 'klant',
  department department_type NOT NULL DEFAULT 'algemeen',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Leads & Opportunities
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  value DECIMAL(12,2),
  status lead_status NOT NULL DEFAULT 'nieuw',
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  department department_type NOT NULL DEFAULT 'algemeen',
  expected_close_date DATE,
  closed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CRM Activiteiten (Activities/Interactions)
CREATE TABLE public.crm_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'call', 'email', 'meeting', 'note', 'task'
  subject TEXT NOT NULL,
  description TEXT,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  department department_type NOT NULL DEFAULT 'algemeen',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public access for now, can be restricted later with auth)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

-- Public access policies (since no auth is required yet)
CREATE POLICY "Allow public read access on companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on companies" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on companies" ON public.companies FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on companies" ON public.companies FOR DELETE USING (true);

CREATE POLICY "Allow public read access on contacts" ON public.contacts FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on contacts" ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on contacts" ON public.contacts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on contacts" ON public.contacts FOR DELETE USING (true);

CREATE POLICY "Allow public read access on leads" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on leads" ON public.leads FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on leads" ON public.leads FOR DELETE USING (true);

CREATE POLICY "Allow public read access on crm_activities" ON public.crm_activities FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on crm_activities" ON public.crm_activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on crm_activities" ON public.crm_activities FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on crm_activities" ON public.crm_activities FOR DELETE USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER handle_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();