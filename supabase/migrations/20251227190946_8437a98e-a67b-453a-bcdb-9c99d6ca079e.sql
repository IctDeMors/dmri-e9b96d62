-- Standaard producten tabel (generieke productdefinities)
CREATE TABLE public.panel_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dikte INTEGER NOT NULL, -- Dikte in mm (24, 48, etc)
  opbouw TEXT NOT NULL, -- Volledige opbouw beschrijving
  base_price NUMERIC(10,2), -- Optionele standaard basisprijs
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contractprijzen per klant
CREATE TABLE public.panel_contract_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.panel_products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  price_per_m2 NUMERIC(10,2) NOT NULL, -- Prijs per m2
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE, -- NULL = onbeperkt geldig
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, company_id, valid_from)
);

-- Enable RLS
ALTER TABLE public.panel_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panel_contract_prices ENABLE ROW LEVEL SECURITY;

-- RLS policies for panel_products
CREATE POLICY "Allow public read access on panel_products" ON public.panel_products FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on panel_products" ON public.panel_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on panel_products" ON public.panel_products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on panel_products" ON public.panel_products FOR DELETE USING (true);

-- RLS policies for panel_contract_prices  
CREATE POLICY "Allow public read access on panel_contract_prices" ON public.panel_contract_prices FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on panel_contract_prices" ON public.panel_contract_prices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on panel_contract_prices" ON public.panel_contract_prices FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on panel_contract_prices" ON public.panel_contract_prices FOR DELETE USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_panel_products_updated_at
  BEFORE UPDATE ON public.panel_products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_panel_contract_prices_updated_at
  BEFORE UPDATE ON public.panel_contract_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();