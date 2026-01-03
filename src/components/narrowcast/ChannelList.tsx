import { useState } from 'react';
import { NarrowcastChannel } from './types';
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
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Plus, Tv, Settings, Trash2, Play, ExternalLink } from 'lucide-react';

interface ChannelListProps {
  channels: NarrowcastChannel[];
  selectedChannel: NarrowcastChannel | null;
  onSelectChannel: (channel: NarrowcastChannel) => void;
  onCreateChannel: (channel: Partial<NarrowcastChannel>) => Promise<NarrowcastChannel | null>;
  onUpdateChannel: (id: string, updates: Partial<NarrowcastChannel>) => Promise<boolean>;
  onDeleteChannel: (id: string) => Promise<boolean>;
}

export function ChannelList({
  channels,
  selectedChannel,
  onSelectChannel,
  onCreateChannel,
  onUpdateChannel,
  onDeleteChannel,
}: ChannelListProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteChannelId, setDeleteChannelId] = useState<string | null>(null);
  const [editingChannel, setEditingChannel] = useState<NarrowcastChannel | null>(null);
  
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDuration, setNewDuration] = useState(10);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    
    await onCreateChannel({
      name: newName,
      description: newDescription || null,
      slide_duration: newDuration,
      is_active: true,
    });
    
    setNewName('');
    setNewDescription('');
    setNewDuration(10);
    setIsCreateOpen(false);
  };

  const handleEdit = async () => {
    if (!editingChannel) return;
    
    await onUpdateChannel(editingChannel.id, {
      name: editingChannel.name,
      description: editingChannel.description,
      slide_duration: editingChannel.slide_duration,
      is_active: editingChannel.is_active,
    });
    
    setIsEditOpen(false);
    setEditingChannel(null);
  };

  const handleDelete = async () => {
    if (!deleteChannelId) return;
    await onDeleteChannel(deleteChannelId);
    setDeleteChannelId(null);
  };

  const openPresentation = (channelId: string) => {
    window.open(`/narrowcast/${channelId}`, '_blank');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Tv className="w-5 h-5" />
            Kanalen
          </CardTitle>
          <CardDescription>Beheer je narrowcasting kanalen</CardDescription>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nieuw kanaal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuw kanaal aanmaken</DialogTitle>
              <DialogDescription>
                Maak een nieuw narrowcasting kanaal aan
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Naam</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Bijv. Lobby TV"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Beschrijving</Label>
                <Textarea
                  id="description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Optionele beschrijving..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Standaard slide duur (seconden)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  value={newDuration}
                  onChange={(e) => setNewDuration(parseInt(e.target.value) || 10)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Annuleren
              </Button>
              <Button onClick={handleCreate} disabled={!newName.trim()}>
                Aanmaken
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {channels.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Nog geen kanalen. Maak je eerste kanaal aan.
            </p>
          ) : (
            channels.map((channel) => (
              <div
                key={channel.id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedChannel?.id === channel.id
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted'
                }`}
                onClick={() => onSelectChannel(channel)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      channel.is_active ? 'bg-green-500' : 'bg-muted-foreground'
                    }`}
                  />
                  <div>
                    <p className="font-medium">{channel.name}</p>
                    {channel.description && (
                      <p className="text-sm text-muted-foreground">{channel.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPresentation(channel.id);
                    }}
                    title="Open presentatie"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingChannel({ ...channel });
                      setIsEditOpen(true);
                    }}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteChannelId(channel.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kanaal bewerken</DialogTitle>
          </DialogHeader>
          {editingChannel && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Naam</Label>
                <Input
                  id="edit-name"
                  value={editingChannel.name}
                  onChange={(e) =>
                    setEditingChannel({ ...editingChannel, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Beschrijving</Label>
                <Textarea
                  id="edit-description"
                  value={editingChannel.description || ''}
                  onChange={(e) =>
                    setEditingChannel({ ...editingChannel, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Standaard slide duur (seconden)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  min={1}
                  value={editingChannel.slide_duration}
                  onChange={(e) =>
                    setEditingChannel({
                      ...editingChannel,
                      slide_duration: parseInt(e.target.value) || 10,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-active">Actief</Label>
                <Switch
                  id="edit-active"
                  checked={editingChannel.is_active}
                  onCheckedChange={(checked) =>
                    setEditingChannel({ ...editingChannel, is_active: checked })
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
      <AlertDialog open={!!deleteChannelId} onOpenChange={() => setDeleteChannelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kanaal verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je dit kanaal wilt verwijderen? Alle content in dit kanaal
              wordt ook verwijderd. Dit kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
