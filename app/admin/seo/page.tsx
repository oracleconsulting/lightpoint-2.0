'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Globe, FileText, Image as ImageIcon, Loader2, Check, AlertCircle, Sparkles } from 'lucide-react';
import { trpc } from '@/lib/trpc/Provider';

interface SEOSettings {
  page: string;
  pagePath: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogImage: string;
  canonicalUrl: string;
}

// Default SEO data for all pages
const DEFAULT_SEO_DATA: SEOSettings[] = [
  {
    page: 'Homepage',
    pagePath: '/',
    metaTitle: 'Lightpoint - HMRC Complaint Management for Accountants',
    metaDescription: 'Win more HMRC complaints. Recover professional fees. AI-powered complaint management for UK accountants.',
    metaKeywords: 'HMRC complaints, accountant fees, tax disputes, charter breaches',
    ogImage: '/og-image.jpg',
    canonicalUrl: 'https://lightpoint.uk',
  },
  {
    page: 'Pricing',
    pagePath: '/pricing',
    metaTitle: 'Pricing - Lightpoint HMRC Complaint Management',
    metaDescription: 'Affordable HMRC complaint management for accounting practices. Pay per complaint or subscribe. Start free.',
    metaKeywords: 'HMRC complaint pricing, accountant software pricing, tax dispute costs',
    ogImage: '/og-image.jpg',
    canonicalUrl: 'https://lightpoint.uk/pricing',
  },
  {
    page: 'Blog',
    pagePath: '/blog',
    metaTitle: 'Blog - HMRC Complaint Insights | Lightpoint',
    metaDescription: 'Expert insights on HMRC complaints, tax disputes, and professional fee recovery. Tips for UK accountants.',
    metaKeywords: 'HMRC blog, tax dispute advice, accountant tips, complaint handling',
    ogImage: '/og-image.jpg',
    canonicalUrl: 'https://lightpoint.uk/blog',
  },
  {
    page: 'CPD',
    pagePath: '/cpd',
    metaTitle: 'CPD Articles - Professional Development | Lightpoint',
    metaDescription: 'Continuing Professional Development articles for UK accountants. HMRC compliance and complaint handling.',
    metaKeywords: 'CPD articles, accountant training, HMRC compliance, professional development',
    ogImage: '/og-image.jpg',
    canonicalUrl: 'https://lightpoint.uk/cpd',
  },
  {
    page: 'Webinars',
    pagePath: '/webinars',
    metaTitle: 'Webinars - HMRC Training for Accountants | Lightpoint',
    metaDescription: 'Free webinars on HMRC complaint handling, fee recovery, and tax dispute resolution for accountants.',
    metaKeywords: 'HMRC webinars, accountant training, tax dispute webinar, free CPD',
    ogImage: '/og-image.jpg',
    canonicalUrl: 'https://lightpoint.uk/webinars',
  },
  {
    page: 'Examples',
    pagePath: '/examples',
    metaTitle: 'Worked Examples - Real HMRC Cases | Lightpoint',
    metaDescription: 'Real-world HMRC complaint case studies. Learn from successful fee recovery and dispute resolution examples.',
    metaKeywords: 'HMRC case studies, complaint examples, tax dispute cases, fee recovery examples',
    ogImage: '/og-image.jpg',
    canonicalUrl: 'https://lightpoint.uk/examples',
  },
  {
    page: 'About',
    pagePath: '/about',
    metaTitle: 'About Lightpoint - HMRC Complaint Specialists',
    metaDescription: 'Learn about Lightpoint, the AI-powered HMRC complaint management system built for UK accountants.',
    metaKeywords: 'about Lightpoint, HMRC specialists, complaint software company',
    ogImage: '/og-image.jpg',
    canonicalUrl: 'https://lightpoint.uk/about',
  },
  {
    page: 'Contact',
    pagePath: '/contact',
    metaTitle: 'Contact Us - Lightpoint Support',
    metaDescription: 'Get in touch with Lightpoint. Questions about HMRC complaint management? We\'re here to help.',
    metaKeywords: 'contact Lightpoint, HMRC complaint help, support',
    ogImage: '/og-image.jpg',
    canonicalUrl: 'https://lightpoint.uk/contact',
  },
];

export default function SEOManagement() {
  const [seoData, setSeoData] = useState<SEOSettings[]>(DEFAULT_SEO_DATA);
  const [editingPage, setEditingPage] = useState<string>('Homepage');
  const [formData, setFormData] = useState<SEOSettings>(DEFAULT_SEO_DATA[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Get the update mutation
  const updateSEO = trpc.cms.updateSEOMetadata.useMutation({
    onSuccess: () => {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
    onError: () => {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
  });

  const handlePageSelect = (page: string) => {
    const pageData = seoData.find(s => s.page === page);
    if (pageData) {
      setEditingPage(page);
      setFormData(pageData);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Update local state
      setSeoData(seoData.map(s => 
        s.page === editingPage ? formData : s
      ));

      // Save to database
      await updateSEO.mutateAsync({
        pagePath: formData.pagePath,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        metaKeywords: formData.metaKeywords.split(',').map(k => k.trim()),
        ogImageUrl: formData.ogImage,
      });

    } catch (error) {
      console.error('Failed to save SEO settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Character count helpers
  const titleLength = formData.metaTitle.length;
  const descLength = formData.metaDescription.length;
  const titleStatus = titleLength <= 60 ? 'good' : 'warning';
  const descStatus = descLength <= 160 ? 'good' : 'warning';

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
            {seoData.map((item) => (
              <Button
                key={item.page}
                variant={editingPage === item.page ? 'default' : 'outline'}
                onClick={() => handlePageSelect(item.page)}
                size="sm"
              >
                {item.page}
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
              <span className={`text-xs ml-2 ${titleStatus === 'good' ? 'text-green-600' : 'text-amber-600'}`}>
                ({titleLength}/60 characters)
              </span>
            </label>
            <input
              type="text"
              maxLength={70}
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
              <span className={`text-xs ml-2 ${descStatus === 'good' ? 'text-green-600' : 'text-amber-600'}`}>
                ({descLength}/160 characters)
              </span>
            </label>
            <textarea
              rows={3}
              maxLength={170}
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
              placeholder="https://lightpoint.uk/page"
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
              <div className="text-sm text-blue-700 hover:underline cursor-pointer mb-1 truncate">
                {formData.metaTitle || 'Page Title'}
              </div>
              <div className="text-xs text-green-700 mb-1">{formData.canonicalUrl}</div>
              <div className="text-sm text-gray-600 line-clamp-2">{formData.metaDescription}</div>
            </div>
          </div>

          {/* AI Search Preview */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              AI Search Visibility
            </h3>
            <div className="bg-purple-50 rounded-card p-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>How AI assistants see this page:</strong>
              </p>
              <div className="text-sm text-gray-600 bg-white rounded p-3 border border-purple-100">
                <p className="font-medium">{formData.metaTitle}</p>
                <p className="mt-1">{formData.metaDescription}</p>
                <p className="mt-2 text-xs text-purple-600">
                  Topics: {formData.metaKeywords}
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              {saveStatus === 'success' && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  Saved successfully!
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  Failed to save - changes stored locally
                </span>
              )}
            </div>
            <Button onClick={handleSave} size="lg" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save SEO Settings
                </>
              )}
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
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Traditional SEO</h4>
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
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">AI Search Optimization</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">✓</span>
                  <span>Be specific about what problems you solve</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">✓</span>
                  <span>Use natural language AI can understand</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">✓</span>
                  <span>Include your target audience (UK accountants)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">✓</span>
                  <span>Mention unique features (AI-powered, fee recovery)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">✓</span>
                  <span>Keep structured data (keywords) relevant</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
