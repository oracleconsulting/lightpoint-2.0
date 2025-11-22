'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Globe, FileText, Image as ImageIcon } from 'lucide-react';

interface SEOSettings {
  page: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogImage: string;
  canonicalUrl: string;
}

export default function SEOManagement() {
  const [seoData, setSeoData] = useState<SEOSettings[]>([
    {
      page: 'Homepage',
      metaTitle: 'Lightpoint - HMRC Complaint Management for Accountants',
      metaDescription: 'Win more HMRC complaints. Recover professional fees. AI-powered complaint management for UK accountants.',
      metaKeywords: 'HMRC complaints, accountant fees, tax disputes, charter breaches',
      ogImage: '/og-image.jpg',
      canonicalUrl: 'https://lightpoint.co.uk',
    },
  ]);

  const [editingPage, setEditingPage] = useState<string>('Homepage');
  const [formData, setFormData] = useState<SEOSettings>(seoData[0]);

  const handlePageSelect = (page: string) => {
    const pageData = seoData.find(s => s.page === page);
    if (pageData) {
      setEditingPage(page);
      setFormData(pageData);
    }
  };

  const handleSave = () => {
    setSeoData(seoData.map(s => 
      s.page === editingPage ? formData : s
    ));
    alert('SEO settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-gray-900">SEO Settings</h1>
        <p className="text-gray-600 mt-2">Optimize meta tags and search engine visibility</p>
      </div>

      {/* Page Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Page</CardTitle>
          <CardDescription>Choose which page to edit SEO settings for</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['Homepage', 'Pricing', 'Blog', 'CPD', 'Webinars', 'Examples', 'About', 'Contact'].map((page) => (
              <Button
                key={page}
                variant={editingPage === page ? 'default' : 'outline'}
                onClick={() => handlePageSelect(page)}
                size="sm"
              >
                {page}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SEO Editor */}
      <Card className="border-brand-gold/30 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-brand-gold" />
            <CardTitle>{editingPage} - SEO Settings</CardTitle>
          </div>
          <CardDescription>Optimize for search engines and social media</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Meta Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Title *
              <span className="text-xs text-gray-500 ml-2">({formData.metaTitle.length}/60 characters)</span>
            </label>
            <input
              type="text"
              maxLength={60}
              className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
              placeholder="Page title for search results..."
              value={formData.metaTitle}
              onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">Aim for 50-60 characters. This appears in search results.</p>
          </div>

          {/* Meta Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Description *
              <span className="text-xs text-gray-500 ml-2">({formData.metaDescription.length}/160 characters)</span>
            </label>
            <textarea
              rows={3}
              maxLength={160}
              className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
              placeholder="Brief description for search results..."
              value={formData.metaDescription}
              onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">Aim for 150-160 characters. Include keywords naturally.</p>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Keywords (comma-separated)
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
              placeholder="keyword1, keyword2, keyword3"
              value={formData.metaKeywords}
              onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">5-10 relevant keywords for this page.</p>
          </div>

          {/* Canonical URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Canonical URL
            </label>
            <input
              type="url"
              className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
              placeholder="https://lightpoint.co.uk/page"
              value={formData.canonicalUrl}
              onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">Preferred URL for this page (prevents duplicate content).</p>
          </div>

          {/* OG Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Open Graph Image
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                placeholder="/og-image.jpg"
                value={formData.ogImage}
                onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
              />
              <Button variant="outline" size="icon">
                <ImageIcon className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Image shown when shared on social media (1200x630px recommended).</p>
          </div>

          {/* Preview */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Search Result Preview
            </h3>
            <div className="bg-gray-50 rounded-card p-4">
              <div className="text-sm text-brand-primary hover:underline cursor-pointer mb-1">
                {formData.metaTitle}
              </div>
              <div className="text-xs text-success mb-1">{formData.canonicalUrl}</div>
              <div className="text-sm text-gray-600">{formData.metaDescription}</div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} size="lg">
              <Save className="h-4 w-4 mr-2" />
              Save SEO Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SEO Tips */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-brand-gold">✓</span>
              <span>Use unique titles for each page</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-gold">✓</span>
              <span>Include target keywords naturally</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-gold">✓</span>
              <span>Write compelling descriptions that encourage clicks</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-gold">✓</span>
              <span>Keep titles under 60 characters</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-gold">✓</span>
              <span>Keep descriptions between 150-160 characters</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
