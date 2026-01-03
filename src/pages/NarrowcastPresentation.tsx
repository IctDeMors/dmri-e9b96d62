import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { NarrowcastChannel, NarrowcastItem } from '@/components/narrowcast/types';
import { Loader2 } from 'lucide-react';

export default function NarrowcastPresentation() {
  const { channelId } = useParams<{ channelId: string }>();
  const [channel, setChannel] = useState<NarrowcastChannel | null>(null);
  const [items, setItems] = useState<NarrowcastItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!channelId) return;

    const { data: channelData, error: channelError } = await supabase
      .from('narrowcast_channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (channelError) {
      setError('Kanaal niet gevonden');
      setLoading(false);
      return;
    }

    setChannel(channelData as NarrowcastChannel);

    const now = new Date().toISOString();
    const { data: itemsData, error: itemsError } = await supabase
      .from('narrowcast_items')
      .select('*')
      .eq('channel_id', channelId)
      .eq('is_active', true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('position', { ascending: true });

    if (!itemsError && itemsData) {
      setItems(itemsData as NarrowcastItem[]);
    }

    setLoading(false);
  }, [channelId]);

  useEffect(() => {
    fetchData();

    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (items.length === 0) return;

    const currentItem = items[currentIndex];
    const duration = currentItem?.duration || channel?.slide_duration || 10;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, duration * 1000);

    return () => clearTimeout(timer);
  }, [currentIndex, items, channel]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white text-2xl">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-2xl mb-2">{channel?.name}</p>
          <p className="text-white/60">Geen content beschikbaar</p>
        </div>
      </div>
    );
  }

  const currentItem = items[currentIndex];

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Progress indicator */}
      <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
        {items.map((_, index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full overflow-hidden ${
              index === currentIndex ? 'bg-white/30' : 'bg-white/10'
            }`}
          >
            {index === currentIndex && (
              <div
                className="h-full bg-white animate-progress"
                style={{
                  animationDuration: `${currentItem.duration}s`,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="w-full h-full flex items-center justify-center">
        {currentItem.content_type === 'image' && currentItem.content_url && (
          <img
            src={currentItem.content_url}
            alt={currentItem.title || 'Slide'}
            className="max-w-full max-h-full object-contain"
          />
        )}

        {currentItem.content_type === 'video' && currentItem.content_url && (
          <video
            src={currentItem.content_url}
            autoPlay
            muted
            loop={false}
            className="max-w-full max-h-full object-contain"
            onEnded={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
          />
        )}

        {currentItem.content_type === 'text' && (
          <div className="max-w-4xl mx-auto p-12 text-center">
            {currentItem.title && (
              <h1 className="text-6xl font-bold text-white mb-8">
                {currentItem.title}
              </h1>
            )}
            <p className="text-4xl text-white/90 leading-relaxed whitespace-pre-wrap">
              {currentItem.content_text}
            </p>
          </div>
        )}
      </div>

      {/* Title overlay for images/videos */}
      {currentItem.content_type !== 'text' && currentItem.title && (
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
          <h2 className="text-3xl font-bold text-white">{currentItem.title}</h2>
        </div>
      )}

      <style>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        .animate-progress {
          animation: progress linear forwards;
        }
      `}</style>
    </div>
  );
}
