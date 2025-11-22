'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Eye, EyeOff, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc/Provider';

interface PageSection {
  id: string;
  page_name: string;
  section_key: string;
  section_title: string;
  content: Record<string, any>;
  display_order: number;
  is_visible: boolean;
  updated_at: string;
}

export default function PageContentManagement() {
  const [selectedPage, setSelectedPage] = useState<string>('homepage');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<{ id: string; status: 'success' | 'error' } | null>(null);

  // Fetch all sections for admin
  const { data: sections, refetch, isLoading } = trpc.cms.getAllPageSections.useQuery({
    pageName: selectedPage,
  });

  // Update section mutation
  const updateSection = trpc.cms.updatePageSection.useMutation({
    onSuccess: () => {
      refetch();
      setSaveStatus({ id: editingSection!, status: 'success' });
      setTimeout(() => setSaveStatus(null), 3000);
      setEditingSection(null);
    },
    onError: () => {
      setSaveStatus({ id: editingSection!, status: 'error' });
      setTimeout(() => setSaveStatus(null), 3000);
    },
  });

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  const startEditing = (section: PageSection) => {
    setEditingSection(section.id);
    setEditedContent(JSON.stringify(section.content, null, 2));
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditedContent('');
  };

  const saveSection = (section: PageSection) => {
    try {
      const parsedContent = JSON.parse(editedContent);
      updateSection.mutate({
        id: section.id,
        content: parsedContent,
      });
    } catch (error) {
      setSaveStatus({ id: section.id, status: 'error' });
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const toggleVisibility = (section: PageSection) => {
    updateSection.mutate({
      id: section.id,
      isVisible: !section.is_visible,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900">Page Content Editor</h1>
          <p className="text-gray-600 mt-2">
            Edit ALL website content without touching code. Changes are live immediately.
          </p>
        </div>
      </div>

      {/* Page Selector */}
      <Card>
        <CardContent className="pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Page</label>
          <select
            className="w-full md:w-auto px-4 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
          >
            <option value="homepage">Homepage</option>
            <option value="pricing">Pricing</option>
            <option value="about">About</option>
            <option value="contact">Contact</option>
          </select>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-card p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-brand-primary flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-700">
          <p className="font-semibold text-gray-900 mb-1">How to Edit Content:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Click "Edit JSON" to modify any section's content</li>
            <li>Content is stored as JSON for maximum flexibility</li>
            <li>Use the visibility toggle to hide/show sections</li>
            <li>Changes take effect immediately on save</li>
          </ul>
        </div>
      </div>

      {/* Sections List */}
      {sections && sections.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 mb-4">No content sections found for this page.</p>
            <p className="text-sm text-gray-400">Run the seed migration to populate initial content.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sections?.map((section: PageSection) => {
            const isExpanded = expandedSections.has(section.id);
            const isEditing = editingSection === section.id;
            const hasStatus = saveStatus?.id === section.id;

            return (
              <Card
                key={section.id}
                className={`transition-all ${
                  !section.is_visible ? 'opacity-60 border-dashed' : ''
                } ${isEditing ? 'ring-2 ring-brand-gold border-brand-gold' : ''}`}
              >
                <CardContent className="p-6">
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-medium px-2 py-1 rounded-button bg-brand-blurple/10 text-brand-blurple">
                          {section.page_name}
                        </span>
                        <span className="text-xs font-medium px-2 py-1 rounded-button bg-gray-100 text-gray-600">
                          {section.section_key}
                        </span>
                        <span className="text-xs text-gray-400">
                          Order: {section.display_order}
                        </span>
                        {!section.is_visible && (
                          <span className="text-xs font-medium px-2 py-1 rounded-button bg-red-100 text-red-600">
                            Hidden
                          </span>
                        )}
                        {hasStatus && (
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-button flex items-center gap-1 ${
                              saveStatus.status === 'success'
                                ? 'bg-success/10 text-success'
                                : 'bg-red-100 text-red-600'
                            }`}
                          >
                            {saveStatus.status === 'success' ? (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                Saved!
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3" />
                                Error
                              </>
                            )}
                          </span>
                        )}
                      </div>
                      <h3 className="font-heading text-lg font-semibold text-gray-900">
                        {section.section_title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Last updated: {new Date(section.updated_at).toLocaleString('en-GB')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleVisibility(section)}
                        title={section.is_visible ? 'Hide section' : 'Show section'}
                      >
                        {section.is_visible ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(section.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {!isEditing ? (
                        <>
                          <pre className="bg-gray-50 p-4 rounded-button text-xs overflow-x-auto font-mono text-gray-700 mb-4">
                            {JSON.stringify(section.content, null, 2)}
                          </pre>
                          <Button
                            onClick={() => startEditing(section)}
                            className="gap-2"
                          >
                            Edit JSON Content
                          </Button>
                        </>
                      ) : (
                        <>
                          <textarea
                            className="w-full h-96 px-4 py-3 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold font-mono text-xs"
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            spellCheck={false}
                          />
                          <div className="mt-4 flex gap-2">
                            <Button
                              onClick={() => saveSection(section)}
                              disabled={updateSection.isPending}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              {updateSection.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={cancelEditing}
                              disabled={updateSection.isPending}
                            >
                              Cancel
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
