'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Plus, Trash2, Eye, EyeOff, Video, Calendar, Users } from 'lucide-react';

interface Webinar {
  id: string;
  title: string;
  description: string;
  scheduledDate: string;
  duration: number;
  videoUrl: string;
  tier: string;
  maxAttendees: number;
  isLive: boolean;
  isPublished: boolean;
}

export default function WebinarManagement() {
  const [webinars, setWebinars] = useState<Webinar[]>([
    {
      id: '1',
      title: 'Mastering HMRC Complaints: Live Q&A',
      description: 'Join us for a live session on handling complex HMRC complaints',
      scheduledDate: '2024-12-15T14:00',
      duration: 60,
      videoUrl: 'https://zoom.us/j/example',
      tier: 'Professional',
      maxAttendees: 100,
      isLive: false,
      isPublished: true,
    },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Webinar>>({});

  const tiers = ['Free', 'Professional', 'Enterprise'];

  const handleEdit = (webinar: Webinar) => {
    setEditingId(webinar.id);
    setFormData(webinar);
  };

  const handleSave = () => {
    if (editingId && editingId !== 'new') {
      setWebinars(webinars.map(w => w.id === editingId ? { ...w, ...formData } as Webinar : w));
      setEditingId(null);
      setFormData({});
    }
  };

  const handleAdd = () => {
    const newWebinar: Webinar = {
      id: Date.now().toString(),
      title: formData.title || 'Untitled Webinar',
      description: formData.description || '',
      scheduledDate: formData.scheduledDate || new Date().toISOString().slice(0, 16),
      duration: formData.duration || 60,
      videoUrl: formData.videoUrl || '',
      tier: formData.tier || 'Professional',
      maxAttendees: formData.maxAttendees || 100,
      isLive: false,
      isPublished: false,
    };
    setWebinars([newWebinar, ...webinars]);
    setFormData({});
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this webinar?')) {
      setWebinars(webinars.filter(w => w.id !== id));
    }
  };

  const togglePublish = (id: string) => {
    setWebinars(webinars.map(w => 
      w.id === id ? { ...w, isPublished: !w.isPublished } : w
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900">Webinars</h1>
          <p className="text-gray-600 mt-2">Schedule and manage live training sessions</p>
        </div>
        <Button onClick={() => setEditingId('new')} className="gap-2">
          <Plus className="h-4 w-4" />
          New Webinar
        </Button>
      </div>

      {/* Editor */}
      {(editingId === 'new' || editingId) && (
        <Card className="border-brand-gold/30 shadow-lg">
          <CardHeader>
            <CardTitle>{editingId === 'new' ? 'Schedule Webinar' : 'Edit Webinar'}</CardTitle>
            <CardDescription>Live and recorded training sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                placeholder="Webinar title..."
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                placeholder="What will attendees learn?"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  value={formData.scheduledDate || ''}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  value={formData.duration || ''}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Video/Meeting URL</label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  placeholder="https://zoom.us/j/..."
                  value={formData.videoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Attendees</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  value={formData.maxAttendees || ''}
                  onChange={(e) => setFormData({ ...formData, maxAttendees: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Required Tier</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                value={formData.tier || ''}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
              >
                {tiers.map(tier => (
                  <option key={tier} value={tier}>{tier}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => { setEditingId(null); setFormData({}); }}>
                Cancel
              </Button>
              <Button onClick={editingId === 'new' ? handleAdd : handleSave}>
                <Save className="h-4 w-4 mr-2" />
                {editingId === 'new' ? 'Schedule' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webinars Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {webinars.map((webinar) => (
          <Card key={webinar.id} className={`${!webinar.isPublished ? 'opacity-60' : ''} hover:shadow-lg transition-shadow`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {webinar.isPublished ? (
                    <Eye className="h-4 w-4 text-brand-gold" aria-label="Published" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" aria-label="Draft" />
                  )}
                  {webinar.isLive && (
                    <span className="text-xs px-2 py-1 rounded-button bg-red-500 text-white font-medium animate-pulse">
                      LIVE
                    </span>
                  )}
                </div>
                <Video className="h-5 w-5 text-brand-gold" />
              </div>

              <h3 className="font-heading text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {webinar.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{webinar.description}</p>

              <div className="space-y-2 text-xs text-gray-500 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {new Date(webinar.scheduledDate).toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  Max {webinar.maxAttendees} attendees
                </div>
                <div className="px-2 py-0.5 rounded-button bg-brand-gold/10 text-brand-gold font-medium inline-block">
                  {webinar.tier}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePublish(webinar.id)}
                  className="flex-1"
                >
                  {webinar.isPublished ? 'Unpublish' : 'Publish'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(webinar)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(webinar.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {webinars.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No webinars scheduled</p>
            <Button onClick={() => setEditingId('new')}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule First Webinar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
