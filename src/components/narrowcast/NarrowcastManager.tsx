import { useState } from 'react';
import { useNarrowcast } from '@/hooks/useNarrowcast';
import { ChannelList } from './ChannelList';
import { ContentManager } from './ContentManager';
import { NarrowcastChannel } from './types';
import { Loader2 } from 'lucide-react';

export function NarrowcastManager() {
  const {
    channels,
    items,
    loading,
    createChannel,
    updateChannel,
    deleteChannel,
    createItem,
    updateItem,
    deleteItem,
    uploadMedia,
    fetchItems,
  } = useNarrowcast();

  const [selectedChannel, setSelectedChannel] = useState<NarrowcastChannel | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <ChannelList
          channels={channels}
          selectedChannel={selectedChannel}
          onSelectChannel={setSelectedChannel}
          onCreateChannel={createChannel}
          onUpdateChannel={updateChannel}
          onDeleteChannel={deleteChannel}
        />
      </div>
      <div className="lg:col-span-2">
        {selectedChannel ? (
          <ContentManager
            channel={selectedChannel}
            items={items}
            onCreateItem={createItem}
            onUpdateItem={updateItem}
            onDeleteItem={deleteItem}
            onUploadMedia={uploadMedia}
            onRefresh={fetchItems}
          />
        ) : (
          <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/50">
            <p className="text-muted-foreground">
              Selecteer een kanaal om de content te beheren
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
