'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Settings, Mail, Bell, Key, Globe } from 'lucide-react';

interface SiteSettings {
  siteName: string;
  tagline: string;
  contactEmail: string;
  supportEmail: string;
  phoneNumber: string;
  address: string;
  enableNotifications: boolean;
  enableNewsletter: boolean;
  maintenanceMode: boolean;
  apiKey: string;
  timezone: string;
  language: string;
}

export default function SiteSettingsManagement() {
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'Lightpoint',
    tagline: 'HMRC Complaint Management for UK Accountants',
    contactEmail: 'contact@lightpoint.co.uk',
    supportEmail: 'support@lightpoint.co.uk',
    phoneNumber: '+44 20 1234 5678',
    address: 'London, United Kingdom',
    enableNotifications: true,
    enableNewsletter: true,
    maintenanceMode: false,
    apiKey: 'lpk_live_********************************',
    timezone: 'Europe/London',
    language: 'en-GB',
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: keyof SiteSettings, value: any) => {
    setSettings({ ...settings, [field]: value });
    setHasChanges(true);
  };

  const handleSave = () => {
    // In real implementation, this would call an API
    alert('Settings saved successfully!');
    setHasChanges(false);
  };

  const handleReset = () => {
    if (confirm('Reset all changes?')) {
      // Reload original settings
      setHasChanges(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900">Site Settings</h1>
          <p className="text-gray-600 mt-2">Configure global site parameters</p>
        </div>
        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-brand-gold" />
            <CardTitle>General Settings</CardTitle>
          </div>
          <CardDescription>Basic site configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Site Name *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                value={settings.siteName}
                onChange={(e) => handleChange('siteName', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                value={settings.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                value={settings.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
              >
                <option value="Europe/London">London (GMT)</option>
                <option value="America/New_York">New York (EST)</option>
                <option value="Asia/Dubai">Dubai (GST)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                value={settings.language}
                onChange={(e) => handleChange('language', e.target.value)}
              >
                <option value="en-GB">English (UK)</option>
                <option value="en-US">English (US)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-brand-gold" />
            <CardTitle>Contact Information</CardTitle>
          </div>
          <CardDescription>How users can reach you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email *</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                value={settings.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                value={settings.supportEmail}
                onChange={(e) => handleChange('supportEmail', e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                value={settings.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                value={settings.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-brand-gold" />
            <CardTitle>Notifications & Features</CardTitle>
          </div>
          <CardDescription>Enable or disable site features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-button">
            <div>
              <div className="font-medium text-gray-900">Email Notifications</div>
              <div className="text-sm text-gray-600">Send transactional emails to users</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.enableNotifications}
                onChange={(e) => handleChange('enableNotifications', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-gold/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-gold"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-button">
            <div>
              <div className="font-medium text-gray-900">Newsletter Signups</div>
              <div className="text-sm text-gray-600">Allow users to subscribe to newsletter</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.enableNewsletter}
                onChange={(e) => handleChange('enableNewsletter', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-gold/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-gold"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 rounded-button border border-red-200">
            <div>
              <div className="font-medium text-red-900">Maintenance Mode</div>
              <div className="text-sm text-red-600">Hide site from public (admins can still access)</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.maintenanceMode}
                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-brand-gold" />
            <CardTitle>API Configuration</CardTitle>
          </div>
          <CardDescription>Integration and API settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
            <div className="flex gap-2">
              <input
                type="password"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold font-mono text-sm"
                value={settings.apiKey}
                readOnly
              />
              <Button variant="outline">Regenerate</Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Keep this secret! Used for API integrations.</p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button (Fixed) */}
      {hasChanges && (
        <div className="fixed bottom-8 right-8 flex gap-2 shadow-2xl">
          <Button variant="outline" size="lg" onClick={handleReset}>
            Reset Changes
          </Button>
          <Button size="lg" onClick={handleSave} className="shadow-xl">
            <Save className="h-4 w-4 mr-2" />
            Save All Settings
          </Button>
        </div>
      )}
    </div>
  );
}
