export interface NarrowcastChannel {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  slide_duration: number;
  created_at: string;
  updated_at: string;
}

export interface NarrowcastItem {
  id: string;
  channel_id: string;
  title: string | null;
  content_type: 'image' | 'video' | 'text';
  content_url: string | null;
  content_text: string | null;
  duration: number;
  position: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}
