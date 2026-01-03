import { useState, useRef } from 'react';
import { NarrowcastChannel, NarrowcastItem } from './types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Image, Video, Type, Trash2, Edit, GripVertical, Loader2 } from 'lucide-react';

interface ContentManagerProps {
  channel: NarrowcastChannel;
  items: NarrowcastItem[];
  onCreateItem: (item: Partial<NarrowcastItem>) => Promise<NarrowcastItem | null>;
  onUpdateItem: (id: string, updates: Partial<NarrowcastItem>) => Promise<boolean>;
  onDeleteItem: (id: string, channelId: string) => Promise<boolean>;
  onUploadMedia: (file: File) => Promise<string | null>;
  onRefresh: (channelId: string) => Promise<void>;
}

export function ContentManager({
  channel,
  items,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  onUploadMedia,
  onRefresh,
}: ContentManagerProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<NarrowcastItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [contentType, setContentType] = useState<'image' | 'video' | 'text'>('image');
  const [title, setTitle] = useState('');
  const [contentText, setContentText] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [duration, setDuration] = useState(channel.slide_duration);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const channelItems = items.filter((item) => item.channel_id === channel.id);

  const resetForm = () => {
    setContentType('image');
    setTitle('');
    setContentText('');
    setContentUrl('');
    setDuration(channel.slide_duration);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const url = await onUploadMedia(file);
    if (url) {
      setContentUrl(url);
    }
    setIsUploading(false);
  };

  const handleCreate = async () => {
    const newItem: Partial<NarrowcastItem> = {
      channel_id: channel.id,
      title: title || null,
      content_type: contentType,
      content_url: contentType !== 'text' ? contentUrl : null,
      content_text: contentType === 'text' ? contentText : null,
      duration,
      position: channelItems.length,
      is_active: true,
    };
    
    await onCreateItem(newItem);
    resetForm();
    setIsAddOpen(false);
  };

  const handleEdit = async () => {
    if (!editingItem) return;
    
    await onUpdateItem(editingItem.id, {
      title: editingItem.title,
      content_text: editingItem.content_text,
      duration: editingItem.duration,
      is_active: editingItem.is_active,
    });
    
    await onRefresh(channel.id);
    setIsEditOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async () => {
    if (!deleteItemId) return;
    await onDeleteItem(deleteItemId, channel.id);
    setDeleteItemId(null);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'text':
        return <Type className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{channel.name} - Content</CardTitle>
          <CardDescription>
            {channelItems.length} item(s) in dit kanaal
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Content toevoegen
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {channelItems.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Nog geen content. Voeg je eerste item toe.
            </p>
          ) : (
            channelItems.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                <div
                  className={`w-2 h-2 rounded-full ${
                    item.is_active ? 'bg-green-500' : 'bg-muted-foreground'
                  }`}
                />
                <div className="flex items-center gap-2 text-muted-foreground">
                  {getIcon(item.content_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {item.title || `Item ${index + 1}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.content_type === 'text'
                      ? item.content_text?.substring(0, 50) + '...'
                      : item.content_type}
                    {' • '}
                    {item.duration}s
                  </p>
                </div>
                {item.content_type === 'image' && item.content_url && (
                  <img
                    src={item.content_url}
                    alt={item.title || 'Preview'}
                    className="w-16 h-12 object-cover rounded"
                  />
                )}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingItem({ ...item });
                      setIsEditOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteItemId(item.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Add Content Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Content toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een afbeelding, video of tekst toe aan dit kanaal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type content</Label>
              <Select
                value={contentType}
                onValueChange={(v) => setContentType(v as 'image' | 'video' | 'text')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Afbeelding
                    </div>
                  </SelectItem>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Video
                    </div>
                  </SelectItem>
                  <SelectItem value="text">
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Tekst
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Titel (optioneel)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Optionele titel..."
              />
            </div>

            {contentType === 'text' ? (
              <div className="space-y-2">
                <Label htmlFor="content-text">Tekst</Label>
                <Textarea
                  id="content-text"
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  placeholder="Voer je tekst in..."
                  rows={5}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>
                  {contentType === 'image' ? 'Afbeelding' : 'Video'}
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                    placeholder="URL of upload een bestand..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Upload'
                    )}
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={contentType === 'image' ? 'image/*' : 'video/*'}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {contentUrl && contentType === 'image' && (
                  <img
                    src={contentUrl}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-lg mt-2"
                  />
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="duration">Weergaveduur (seconden)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 10)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Annuleren
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                contentType === 'text' ? !contentText.trim() : !contentUrl.trim()
              }
            >
              Toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Item bewerken</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Titel</Label>
                <Input
                  id="edit-title"
                  value={editingItem.title || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, title: e.target.value })
                  }
                />
              </div>
              {editingItem.content_type === 'text' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-text">Tekst</Label>
                  <Textarea
                    id="edit-text"
                    value={editingItem.content_text || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, content_text: e.target.value })
                    }
                    rows={5}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Weergaveduur (seconden)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  min={1}
                  value={editingItem.duration}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      duration: parseInt(e.target.value) || 10,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-active">Actief</Label>
                <Switch
                  id="edit-active"
                  checked={editingItem.is_active}
                  onCheckedChange={(checked) =>
                    setEditingItem({ ...editingItem, is_active: checked })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleEdit}>Opslaan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Item verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je dit item wilt verwijderen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
