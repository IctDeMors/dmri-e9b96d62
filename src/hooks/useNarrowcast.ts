import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NarrowcastChannel, NarrowcastItem } from '@/components/narrowcast/types';
import { useToast } from '@/hooks/use-toast';

export function useNarrowcast() {
  const [channels, setChannels] = useState<NarrowcastChannel[]>([]);
  const [items, setItems] = useState<NarrowcastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchChannels = async () => {
    const { data, error } = await supabase
      .from('narrowcast_channels')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching channels:', error);
      return;
    }
    
    setChannels(data as NarrowcastChannel[]);
  };

  const fetchItems = async (channelId?: string) => {
    let query = supabase
      .from('narrowcast_items')
      .select('*')
      .order('position', { ascending: true });
    
    if (channelId) {
      query = query.eq('channel_id', channelId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching items:', error);
      return;
    }
    
    setItems(data as NarrowcastItem[]);
  };

  const createChannel = async (channel: { name: string; description?: string | null; slide_duration?: number; is_active?: boolean }) => {
    const { data, error } = await supabase
      .from('narrowcast_channels')
      .insert([channel])
      .select()
      .single();
    
    if (error) {
      toast({
        title: 'Fout',
        description: 'Kon kanaal niet aanmaken',
        variant: 'destructive',
      });
      return null;
    }
    
    toast({
      title: 'Kanaal aangemaakt',
      description: 'Het kanaal is succesvol aangemaakt',
    });
    
    await fetchChannels();
    return data as NarrowcastChannel;
  };

  const updateChannel = async (id: string, updates: Partial<NarrowcastChannel>) => {
    const { error } = await supabase
      .from('narrowcast_channels')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      toast({
        title: 'Fout',
        description: 'Kon kanaal niet bijwerken',
        variant: 'destructive',
      });
      return false;
    }
    
    toast({
      title: 'Kanaal bijgewerkt',
      description: 'Het kanaal is succesvol bijgewerkt',
    });
    
    await fetchChannels();
    return true;
  };

  const deleteChannel = async (id: string) => {
    const { error } = await supabase
      .from('narrowcast_channels')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({
        title: 'Fout',
        description: 'Kon kanaal niet verwijderen',
        variant: 'destructive',
      });
      return false;
    }
    
    toast({
      title: 'Kanaal verwijderd',
      description: 'Het kanaal is succesvol verwijderd',
    });
    
    await fetchChannels();
    return true;
  };

  const createItem = async (item: { 
    channel_id: string; 
    content_type: 'image' | 'video' | 'text';
    title?: string | null;
    content_url?: string | null;
    content_text?: string | null;
    duration?: number;
    position?: number;
    is_active?: boolean;
  }) => {
    const { data, error } = await supabase
      .from('narrowcast_items')
      .insert([item])
      .select()
      .single();
    
    if (error) {
      toast({
        title: 'Fout',
        description: 'Kon item niet aanmaken',
        variant: 'destructive',
      });
      return null;
    }
    
    toast({
      title: 'Item aangemaakt',
      description: 'Het item is succesvol toegevoegd',
    });
    
    await fetchItems(item.channel_id);
    return data as NarrowcastItem;
  };

  const updateItem = async (id: string, updates: Partial<NarrowcastItem>) => {
    const { error } = await supabase
      .from('narrowcast_items')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      toast({
        title: 'Fout',
        description: 'Kon item niet bijwerken',
        variant: 'destructive',
      });
      return false;
    }
    
    return true;
  };

  const deleteItem = async (id: string, channelId: string) => {
    const { error } = await supabase
      .from('narrowcast_items')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({
        title: 'Fout',
        description: 'Kon item niet verwijderen',
        variant: 'destructive',
      });
      return false;
    }
    
    toast({
      title: 'Item verwijderd',
      description: 'Het item is succesvol verwijderd',
    });
    
    await fetchItems(channelId);
    return true;
  };

  const uploadMedia = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('narrowcast-media')
      .upload(fileName, file);
    
    if (error) {
      toast({
        title: 'Upload mislukt',
        description: 'Kon bestand niet uploaden',
        variant: 'destructive',
      });
      return null;
    }
    
    const { data: urlData } = supabase.storage
      .from('narrowcast-media')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchChannels();
      await fetchItems();
      setLoading(false);
    };
    
    loadData();
  }, []);

  return {
    channels,
    items,
    loading,
    fetchChannels,
    fetchItems,
    createChannel,
    updateChannel,
    deleteChannel,
    createItem,
    updateItem,
    deleteItem,
    uploadMedia,
  };
}
