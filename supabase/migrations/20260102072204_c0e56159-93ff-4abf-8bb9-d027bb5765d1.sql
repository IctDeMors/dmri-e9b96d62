-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create user_departments table for department access
CREATE TABLE public.user_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department department_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, department)
);

-- Enable RLS on user_departments
ALTER TABLE public.user_departments ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create security definer function to check if user has department access
CREATE OR REPLACE FUNCTION public.has_department_access(_user_id UUID, _department department_type)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_departments
    WHERE user_id = _user_id
      AND department = _department
  )
  OR EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  -- Give new users 'user' role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- User roles policies (only admins can manage)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- User departments policies (only admins can manage)
CREATE POLICY "Admins can view all department assignments"
  ON public.user_departments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

CREATE POLICY "Admins can insert department assignments"
  ON public.user_departments FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update department assignments"
  ON public.user_departments FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete department assignments"
  ON public.user_departments FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Drop existing public policies on CRM tables and replace with authenticated policies

-- Companies
DROP POLICY IF EXISTS "Allow public read access on companies" ON public.companies;
DROP POLICY IF EXISTS "Allow public insert access on companies" ON public.companies;
DROP POLICY IF EXISTS "Allow public update access on companies" ON public.companies;
DROP POLICY IF EXISTS "Allow public delete access on companies" ON public.companies;

CREATE POLICY "Authenticated users can read companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_department_access(auth.uid(), department)
  );

CREATE POLICY "Authenticated users can insert companies"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_department_access(auth.uid(), department)
  );

CREATE POLICY "Authenticated users can update companies"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_department_access(auth.uid(), department)
  );

CREATE POLICY "Authenticated users can delete companies"
  ON public.companies FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_department_access(auth.uid(), department)
  );

-- Contacts
DROP POLICY IF EXISTS "Allow public read access on contacts" ON public.contacts;
DROP POLICY IF EXISTS "Allow public insert access on contacts" ON public.contacts;
DROP POLICY IF EXISTS "Allow public update access on contacts" ON public.contacts;
DROP POLICY IF EXISTS "Allow public delete access on contacts" ON public.contacts;

CREATE POLICY "Authenticated users can read contacts"
  ON public.contacts FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_department_access(auth.uid(), department)
  );

CREATE POLICY "Authenticated users can insert contacts"
  ON public.contacts FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_department_access(auth.uid(), department)
  );

CREATE POLICY "Authenticated users can update contacts"
  ON public.contacts FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_department_access(auth.uid(), department)
  );

CREATE POLICY "Authenticated users can delete contacts"
  ON public.contacts FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_department_access(auth.uid(), department)
  );

-- Leads
DROP POLICY IF EXISTS "Allow public read access on leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public insert access on leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public update access on leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public delete access on leads" ON public.leads;

CREATE POLICY "Authenticated users can read leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_department_access(auth.uid(), department)
  );

CREATE POLICY "Authenticated users can insert leads"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_department_access(auth.uid(), department)
  );

CREATE POLICY "Authenticated users can update leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_department_access(auth.uid(), department)
  );

CREATE POLICY "Authenticated users can delete leads"
  ON public.leads FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_department_access(auth.uid(), department)
  );

-- CRM Activities
DROP POLICY IF EXISTS "Allow public read access on crm_activities" ON public.crm_activities;
DROP POLICY IF EXISTS "Allow public insert access on crm_activities" ON public.crm_activities;
DROP POLICY IF EXISTS "Allow public update access on crm_activities" ON public.crm_activities;
DROP POLICY IF EXISTS "Allow public delete access on crm_activities" ON public.crm_activities;

CREATE POLICY "Authenticated users can read crm_activities"
  ON public.crm_activities FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_department_access(auth.uid(), department)
  );

CREATE POLICY "Authenticated users can insert crm_activities"
  ON public.crm_activities FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_department_access(auth.uid(), department)
  );

CREATE POLICY "Authenticated users can update crm_activities"
  ON public.crm_activities FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_department_access(auth.uid(), department)
  );

CREATE POLICY "Authenticated users can delete crm_activities"
  ON public.crm_activities FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_department_access(auth.uid(), department)
  );

-- Panel products (authenticated only, no department restriction)
DROP POLICY IF EXISTS "Allow public read access on panel_products" ON public.panel_products;
DROP POLICY IF EXISTS "Allow public insert access on panel_products" ON public.panel_products;
DROP POLICY IF EXISTS "Allow public update access on panel_products" ON public.panel_products;
DROP POLICY IF EXISTS "Allow public delete access on panel_products" ON public.panel_products;

CREATE POLICY "Authenticated users can read panel_products"
  ON public.panel_products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert panel_products"
  ON public.panel_products FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_department_access(auth.uid(), 'panelen'));

CREATE POLICY "Admins can update panel_products"
  ON public.panel_products FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_department_access(auth.uid(), 'panelen'));

CREATE POLICY "Admins can delete panel_products"
  ON public.panel_products FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_department_access(auth.uid(), 'panelen'));

-- Panel contract prices
DROP POLICY IF EXISTS "Allow public read access on panel_contract_prices" ON public.panel_contract_prices;
DROP POLICY IF EXISTS "Allow public insert access on panel_contract_prices" ON public.panel_contract_prices;
DROP POLICY IF EXISTS "Allow public update access on panel_contract_prices" ON public.panel_contract_prices;
DROP POLICY IF EXISTS "Allow public delete access on panel_contract_prices" ON public.panel_contract_prices;

CREATE POLICY "Authenticated users can read panel_contract_prices"
  ON public.panel_contract_prices FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_department_access(auth.uid(), 'panelen'));

CREATE POLICY "Admins can insert panel_contract_prices"
  ON public.panel_contract_prices FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_department_access(auth.uid(), 'panelen'));

CREATE POLICY "Admins can update panel_contract_prices"
  ON public.panel_contract_prices FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_department_access(auth.uid(), 'panelen'));

CREATE POLICY "Admins can delete panel_contract_prices"
  ON public.panel_contract_prices FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_department_access(auth.uid(), 'panelen'));

-- Panel product layers
DROP POLICY IF EXISTS "Allow public read access on panel_product_layers" ON public.panel_product_layers;
DROP POLICY IF EXISTS "Allow public insert access on panel_product_layers" ON public.panel_product_layers;
DROP POLICY IF EXISTS "Allow public update access on panel_product_layers" ON public.panel_product_layers;
DROP POLICY IF EXISTS "Allow public delete access on panel_product_layers" ON public.panel_product_layers;

CREATE POLICY "Authenticated users can read panel_product_layers"
  ON public.panel_product_layers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert panel_product_layers"
  ON public.panel_product_layers FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_department_access(auth.uid(), 'panelen'));

CREATE POLICY "Admins can update panel_product_layers"
  ON public.panel_product_layers FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_department_access(auth.uid(), 'panelen'));

CREATE POLICY "Admins can delete panel_product_layers"
  ON public.panel_product_layers FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_department_access(auth.uid(), 'panelen'));

-- Updated at trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();