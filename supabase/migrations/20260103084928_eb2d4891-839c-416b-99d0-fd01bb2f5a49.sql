-- Create narrowcasting channels table
CREATE TABLE public.narrowcast_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  slide_duration INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create narrowcasting content items table
CREATE TABLE public.narrowcast_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.narrowcast_channels(id) ON DELETE CASCADE,
  title TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('image', 'video', 'text')),
  content_url TEXT,
  content_text TEXT,
  duration INTEGER NOT NULL DEFAULT 10,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.narrowcast_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrowcast_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for channels - algemeen department can manage
CREATE POLICY "Authenticated users can read narrowcast_channels"
ON public.narrowcast_channels
FOR SELECT
USING (true);

CREATE POLICY "Algemeen users can insert narrowcast_channels"
ON public.narrowcast_channels
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_department_access(auth.uid(), 'algemeen'));

CREATE POLICY "Algemeen users can update narrowcast_channels"
ON public.narrowcast_channels
FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_department_access(auth.uid(), 'algemeen'));

CREATE POLICY "Algemeen users can delete narrowcast_channels"
ON public.narrowcast_channels
FOR DELETE
USING (has_role(auth.uid(), 'admin') OR has_department_access(auth.uid(), 'algemeen'));

-- RLS policies for items
CREATE POLICY "Authenticated users can read narrowcast_items"
ON public.narrowcast_items
FOR SELECT
USING (true);

CREATE POLICY "Algemeen users can insert narrowcast_items"
ON public.narrowcast_items
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_department_access(auth.uid(), 'algemeen'));

CREATE POLICY "Algemeen users can update narrowcast_items"
ON public.narrowcast_items
FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_department_access(auth.uid(), 'algemeen'));

CREATE POLICY "Algemeen users can delete narrowcast_items"
ON public.narrowcast_items
FOR DELETE
USING (has_role(auth.uid(), 'admin') OR has_department_access(auth.uid(), 'algemeen'));

-- Create storage bucket for narrowcasting media
INSERT INTO storage.buckets (id, name, public) VALUES ('narrowcast-media', 'narrowcast-media', true);

-- Storage policies
CREATE POLICY "Anyone can view narrowcast media"
ON storage.objects FOR SELECT
USING (bucket_id = 'narrowcast-media');

CREATE POLICY "Authenticated users can upload narrowcast media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'narrowcast-media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update narrowcast media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'narrowcast-media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete narrowcast media"
ON storage.objects FOR DELETE
USING (bucket_id = 'narrowcast-media' AND auth.role() = 'authenticated');

-- Updated_at triggers
CREATE TRIGGER update_narrowcast_channels_updated_at
BEFORE UPDATE ON public.narrowcast_channels
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_narrowcast_items_updated_at
BEFORE UPDATE ON public.narrowcast_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();