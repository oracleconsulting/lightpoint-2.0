'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getPracticeSettings, savePracticeSettings, PracticeSettings } from '@/lib/practiceSettings';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function PracticeSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<PracticeSettings>({
    firmName: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      postcode: '',
    },
    contact: {
      phone: '',
      email: '',
    },
    chargeOutRate: 250,
  });

  useEffect(() => {
    const existing = getPracticeSettings();
    if (existing) {
      setSettings(existing);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      savePracticeSettings(settings);
      alert('Practice settings saved successfully!');
      router.push('/');
    } catch (error) {
      alert('Failed to save settings. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <CardTitle>Practice Settings</CardTitle>
          </div>
          <CardDescription>
            Configure your firm details for complaint letters. These will be used in the letterhead.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Firm Name */}
            <div className="space-y-2">
              <Label htmlFor="firmName">Firm Name *</Label>
              <Input
                id="firmName"
                value={settings.firmName}
                onChange={(e) => setSettings({ ...settings, firmName: e.target.value })}
                placeholder="e.g. RPGCC LLP"
                required
              />
            </div>

            {/* Address */}
            <div className="space-y-4">
              <Label>Address *</Label>
              <Input
                value={settings.address.line1}
                onChange={(e) => setSettings({ ...settings, address: { ...settings.address, line1: e.target.value } })}
                placeholder="Address Line 1"
                required
              />
              <Input
                value={settings.address.line2 || ''}
                onChange={(e) => setSettings({ ...settings, address: { ...settings.address, line2: e.target.value } })}
                placeholder="Address Line 2 (optional)"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  value={settings.address.city}
                  onChange={(e) => setSettings({ ...settings, address: { ...settings.address, city: e.target.value } })}
                  placeholder="City"
                  required
                />
                <Input
                  value={settings.address.postcode}
                  onChange={(e) => setSettings({ ...settings, address: { ...settings.address, postcode: e.target.value } })}
                  placeholder="Postcode"
                  required
                />
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <Label>Contact Details *</Label>
              <Input
                type="tel"
                value={settings.contact.phone}
                onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, phone: e.target.value } })}
                placeholder="Phone (e.g. 0121 123 4567)"
                required
              />
              <Input
                type="email"
                value={settings.contact.email}
                onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, email: e.target.value } })}
                placeholder="Email"
                required
              />
            </div>

            {/* Charge-out Rate */}
            <div className="space-y-2">
              <Label htmlFor="chargeOutRate">Standard Charge-Out Rate (£/hour) *</Label>
              <Input
                id="chargeOutRate"
                type="number"
                value={settings.chargeOutRate || ''}
                onChange={(e) => setSettings({ ...settings, chargeOutRate: parseInt(e.target.value) || 0 })}
                placeholder="e.g. 275"
                required
              />
              <p className="text-sm text-muted-foreground">
                This will be used in complaint letters when requesting professional fee reimbursement.
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1">
                Save Settings
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

