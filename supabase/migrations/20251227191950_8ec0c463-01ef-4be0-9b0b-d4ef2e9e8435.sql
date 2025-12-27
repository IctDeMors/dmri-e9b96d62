-- Voeg ontbrekende artikelgroepen toe als aparte referentietabel
-- Dit zorgt ervoor dat standaard producten kunnen verwijzen naar generieke groepen
-- die later gekoppeld worden aan specifieke artikelen bij orderinvoer

-- Maak de mapping flexibeler door artikelgroep_alias toe te voegen
-- zodat "Volkern" kan matchen met "TR-UNI COLOURS", "BACKING", etc.
ALTER TABLE public.panel_product_layers ADD COLUMN IF NOT EXISTS artikelgroep_display TEXT;