'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

interface PageSection {
  id: string;
  page: string;
  section: string;
  title: string;
  content: string;
  isPublished: boolean;
}

export default function PageContentManagement() {
  const [sections, setSections] = useState<PageSection[]>([
    {
      id: '1',
      page: 'homepage',
      section: 'hero',
      title: 'Stop Losing Revenue on HMRC Complaints',
      content: 'Win more HMRC complaints. Recover professional fees. Delight your clients.',
      isPublished: true,
    },
    {
      id: '2',
      page: 'homepage',
      section: 'features',
      title: 'Everything You Need',
      content: 'Purpose-built for UK accountants and tax professionals',
      isPublished: true,
    },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PageSection>>({});

  const handleEdit = (section: PageSection) => {
    setEditingId(section.id);
    setFormData(section);
  };

  const handleSave = () => {
    if (editingId) {
      setSections(sections.map(s => s.id === editingId ? { ...s, ...formData } : s));
      setEditingId(null);
      setFormData({});
    }
  };

  const handleAdd = () => {
    const newSection: PageSection = {
      id: Date.now().toString(),
      page: formData.page || 'homepage',
      section: formData.section || 'new-section',
      title: formData.title || 'New Section',
      content: formData.content || '',
      isPublished: false,
    };
    setSections([...sections, newSection]);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this section?')) {
      setSections(sections.filter(s => s.id !== id));
    }
  };

  const togglePublish = (id: string) => {
    setSections(sections.map(s => 
      s.id === id ? { ...s, isPublished: !s.isPublished } : s
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900">Page Content</h1>
          <p className="text-gray-600 mt-2">Manage all editable page sections across your site</p>
        </div>
        <Button onClick={() => setEditingId('new')} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Section
        </Button>
      </div>

      {/* Editor Card */}
      {(editingId === 'new' || editingId) && (
        <Card className="border-brand-gold/30 shadow-lg">
          <CardHeader>
            <CardTitle>{editingId === 'new' ? 'Create New Section' : 'Edit Section'}</CardTitle>
            <CardDescription>Update page content without touching code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Page</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  value={formData.page || ''}
                  onChange={(e) => setFormData({ ...formData, page: e.target.value })}
                >
                  <option value="">Select page...</option>
                  <option value="homepage">Homepage</option>
                  <option value="pricing">Pricing</option>
                  <option value="about">About</option>
                  <option value="contact">Contact</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Section ID</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  placeholder="e.g., hero, features, cta"
                  value={formData.section || ''}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                placeholder="Section title"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                placeholder="Section content..."
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setEditingId(null); setFormData({}); }}>
                Cancel
              </Button>
              <Button onClick={editingId === 'new' ? handleAdd : handleSave}>
                <Save className="h-4 w-4 mr-2" />
                {editingId === 'new' ? 'Create' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sections List */}
      <div className="grid gap-4">
        {sections.map((section) => (
          <Card key={section.id} className={!section.isPublished ? 'opacity-60' : ''}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-medium px-2 py-1 rounded-button bg-brand-blurple/10 text-brand-blurple">
                      {section.page}
                    </span>
                    <span className="text-xs font-medium px-2 py-1 rounded-button bg-gray-100 text-gray-600">
                      {section.section}
                    </span>
                    {section.isPublished ? (
                      <Eye className="h-4 w-4 text-brand-gold" aria-label="Published" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" aria-label="Draft" />
                    )}
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-gray-900 mb-1">
                    {section.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{section.content}</p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePublish(section.id)}
                    title={section.isPublished ? 'Unpublish' : 'Publish'}
                  >
                    {section.isPublished ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(section)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(section.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sections.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 mb-4">No page sections yet</p>
            <Button onClick={() => setEditingId('new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Section
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
