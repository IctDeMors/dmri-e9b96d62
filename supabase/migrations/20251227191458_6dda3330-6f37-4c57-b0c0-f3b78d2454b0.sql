-- Drop oude opbouw kolom en voeg structuur voor lagen toe
-- Eerst tabel voor product lagen maken
CREATE TABLE public.panel_product_layers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.panel_products(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, -- Volgorde van de laag (1, 2, 3, ...)
  laagtype TEXT NOT NULL, -- 'Volkern' of 'Isolatie'
  artikelgroep TEXT NOT NULL, -- bijv. 'TR-UNI COLOURS', 'PU SCHUIM'
  dikte NUMERIC(6,2) NOT NULL, -- Dikte in mm
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.panel_product_layers ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allow public read access on panel_product_layers" ON public.panel_product_layers FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on panel_product_layers" ON public.panel_product_layers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on panel_product_layers" ON public.panel_product_layers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on panel_product_layers" ON public.panel_product_layers FOR DELETE USING (true);

-- Index voor snelle queries
CREATE INDEX idx_panel_product_layers_product_id ON public.panel_product_layers(product_id);

-- Verwijder opbouw kolom uit panel_products (nu opgebouwd uit lagen)
ALTER TABLE public.panel_products DROP COLUMN IF EXISTS opbouw;

-- Voeg een naam toe voor makkelijke herkenning
ALTER TABLE public.panel_products ADD COLUMN IF NOT EXISTS name TEXT;