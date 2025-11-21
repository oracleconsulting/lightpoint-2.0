'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc/client';
import { Loader2, Save, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

export default function TierManagementPage() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  
  const { data: tiers, isLoading } = trpc.subscription.listTiers.useQuery({ includeHidden: true });
  const updateTierMutation = trpc.subscription.updateTier.useMutation();
  const createTierMutation = trpc.subscription.createTier.useMutation();
  const deleteTierMutation = trpc.subscription.deleteTier.useMutation();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Subscription Tier Management</h1>
          <p className="text-muted-foreground mt-2">
            Configure pricing, features, and limits for each subscription tier
          </p>
        </div>
        <Button onClick={() => {/* Create new tier */}}>
          <Plus className="h-4 w-4 mr-2" />
          New Tier
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {tiers?.map((tier) => (
          <TierCard 
            key={tier.id} 
            tier={tier}
            isSelected={selectedTier === tier.id}
            onClick={() => setSelectedTier(tier.id)}
          />
        ))}
      </div>
      
      {selectedTier && (
        <div className="mt-8">
          <TierEditor tierId={selectedTier} />
        </div>
      )}
    </div>
  );
}

interface TierCardProps {
  tier: any;
  isSelected: boolean;
  onClick: () => void;
}

function TierCard({ tier, isSelected, onClick }: TierCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{tier.display_name}</CardTitle>
          <div className="flex gap-2">
            {tier.is_popular && <Badge variant="default">Popular</Badge>}
            {!tier.is_visible && <Badge variant="secondary">Hidden</Badge>}
          </div>
        </div>
        <CardDescription>{tier.tagline}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <p className="text-2xl font-bold">
              £{(tier.monthly_price / 100).toFixed(2)}
              <span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
            <p className="text-sm text-muted-foreground">
              £{(tier.annual_price / 100).toFixed(2)}/year
            </p>
          </div>
          <div className="text-sm">
            <p>
              <strong>Complaints:</strong> {tier.features.complaints.max_per_month === -1 ? 'Unlimited' : tier.features.complaints.max_per_month}/month
            </p>
            <p>
              <strong>Team Members:</strong> {tier.features.collaboration.team_members === -1 ? 'Unlimited' : tier.features.collaboration.team_members}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TierEditorProps {
  tierId: string;
}

function TierEditor({ tierId }: TierEditorProps) {
  const { data: tier, isLoading } = trpc.subscription.getTier.useQuery({ id: tierId });
  const updateMutation = trpc.subscription.updateTier.useMutation();
  
  const [formData, setFormData] = useState(tier);
  
  if (isLoading || !tier) {
    return <Loader2 className="h-6 w-6 animate-spin" />;
  }
  
  const handleSave = async () => {
    await updateMutation.mutateAsync({
      id: tierId,
      ...formData,
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit {tier.display_name} Tier</CardTitle>
        <CardDescription>
          Configure all aspects of this subscription tier
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="cpd">CPD & Learning</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          {/* BASIC INFO TAB */}
          <TabsContent value="basic" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input 
                  id="display_name"
                  value={formData?.display_name || ''}
                  onChange={(e) => setFormData({...formData!, display_name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Internal Name (slug)</Label>
                <Input 
                  id="name"
                  value={formData?.name || ''}
                  onChange={(e) => setFormData({...formData!, name: e.target.value})}
                  disabled
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input 
                id="tagline"
                value={formData?.tagline || ''}
                onChange={(e) => setFormData({...formData!, tagline: e.target.value})}
                placeholder="Perfect for solo practitioners"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                value={formData?.description || ''}
                onChange={(e) => setFormData({...formData!, description: e.target.value})}
                rows={3}
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="monthly_price">Monthly Price (£)</Label>
                <Input 
                  id="monthly_price"
                  type="number"
                  step="0.01"
                  value={(formData?.monthly_price || 0) / 100}
                  onChange={(e) => setFormData({
                    ...formData!, 
                    monthly_price: Math.round(Number.parseFloat(e.target.value) * 100)
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="annual_price">Annual Price (£)</Label>
                <Input 
                  id="annual_price"
                  type="number"
                  step="0.01"
                  value={(formData?.annual_price || 0) / 100}
                  onChange={(e) => setFormData({
                    ...formData!, 
                    annual_price: Math.round(Number.parseFloat(e.target.value) * 100)
                  })}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="is_popular"
                  checked={formData?.is_popular || false}
                  onCheckedChange={(checked) => setFormData({...formData!, is_popular: checked})}
                />
                <Label htmlFor="is_popular">"Most Popular" Badge</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="is_visible"
                  checked={formData?.is_visible || false}
                  onCheckedChange={(checked) => setFormData({...formData!, is_visible: checked})}
                />
                <Label htmlFor="is_visible">Visible on Pricing Page</Label>
              </div>
            </div>
          </TabsContent>
          
          {/* COMPLAINTS TAB */}
          <TabsContent value="complaints" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Complaint Limits</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="max_per_month">Max Complaints per Month</Label>
                  <Input 
                    id="max_per_month"
                    type="number"
                    value={formData?.features.complaints.max_per_month || 0}
                    onChange={(e) => setFormData({
                      ...formData!,
                      features: {
                        ...formData!.features,
                        complaints: {
                          ...formData!.features.complaints,
                          max_per_month: Number.parseInt(e.target.value, 10)
                        }
                      }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">Use -1 for unlimited</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_active">Max Active Complaints</Label>
                  <Input 
                    id="max_active"
                    type="number"
                    value={formData?.features.complaints.max_active || 0}
                    onChange={(e) => setFormData({
                      ...formData!,
                      features: {
                        ...formData!.features,
                        complaints: {
                          ...formData!.features.complaints,
                          max_active: Number.parseInt(e.target.value, 10)
                        }
                      }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">Use -1 for unlimited</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Features</h4>
                
                <FeatureToggle
                  label="Complaint Templates Access"
                  description="Access to pre-built complaint templates"
                  checked={formData?.features.complaints.templates_access || false}
                  onChange={(checked) => setFormData({
                    ...formData!,
                    features: {
                      ...formData!.features,
                      complaints: {
                        ...formData!.features.complaints,
                        templates_access: checked
                      }
                    }
                  })}
                />
                
                <FeatureToggle
                  label="AI Draft Generation"
                  description="AI-powered letter and response drafting"
                  checked={formData?.features.complaints.ai_generation || false}
                  onChange={(checked) => setFormData({
                    ...formData!,
                    features: {
                      ...formData!.features,
                      complaints: {
                        ...formData!.features.complaints,
                        ai_generation: checked
                      }
                    }
                  })}
                />
                
                <FeatureToggle
                  label="Precedent Search"
                  description="Search historical precedents and case law"
                  checked={formData?.features.complaints.precedent_search || false}
                  onChange={(checked) => setFormData({
                    ...formData!,
                    features: {
                      ...formData!.features,
                      complaints: {
                        ...formData!.features.complaints,
                        precedent_search: checked
                      }
                    }
                  })}
                />
              </div>
            </div>
          </TabsContent>
          
          {/* ANALYSIS TAB */}
          <TabsContent value="analysis" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Analysis & Intelligence</h3>
              
              <FeatureToggle
                label="Success Rate Prediction"
                description="AI prediction of complaint success likelihood"
                checked={formData?.features.analysis.success_prediction || false}
                onChange={(checked) => setFormData({
                  ...formData!,
                  features: {
                    ...formData!.features,
                    analysis: {
                      ...formData!.features.analysis,
                      success_prediction: checked
                    }
                  }
                })}
              />
              
              <FeatureToggle
                label="ROI Calculator"
                description="Calculate potential recovery and professional fees"
                checked={formData?.features.analysis.roi_calculator || false}
                onChange={(checked) => setFormData({
                  ...formData!,
                  features: {
                    ...formData!.features,
                    analysis: {
                      ...formData!.features.analysis,
                      roi_calculator: checked
                    }
                  }
                })}
              />
              
              <FeatureToggle
                label="Charter Breach Detection"
                description="Automatic detection of HMRC Charter breaches"
                checked={formData?.features.analysis.charter_detection || false}
                onChange={(checked) => setFormData({
                  ...formData!,
                  features: {
                    ...formData!.features,
                    analysis: {
                      ...formData!.features.analysis,
                      charter_detection: checked
                    }
                  }
                })}
              />
              
              <FeatureToggle
                label="Advanced Analytics"
                description="Detailed dashboards and reporting"
                checked={formData?.features.analysis.advanced_analytics || false}
                onChange={(checked) => setFormData({
                  ...formData!,
                  features: {
                    ...formData!.features,
                    analysis: {
                      ...formData!.features.analysis,
                      advanced_analytics: checked
                    }
                  }
                })}
              />
            </div>
          </TabsContent>
          
          {/* CPD TAB */}
          <TabsContent value="cpd" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">CPD & Professional Development</h3>
              
              <FeatureToggle
                label="CPD Content Access"
                description="Access to articles, guides, and learning materials"
                checked={formData?.features.cpd.access || false}
                onChange={(checked) => setFormData({
                  ...formData!,
                  features: {
                    ...formData!.features,
                    cpd: {
                      ...formData!.features.cpd,
                      access: checked
                    }
                  }
                })}
              />
              
              <FeatureToggle
                label="CPD Certification"
                description="Issue certificates for completed CPD hours"
                checked={formData?.features.cpd.certification || false}
                onChange={(checked) => setFormData({
                  ...formData!,
                  features: {
                    ...formData!.features,
                    cpd: {
                      ...formData!.features.cpd,
                      certification: checked
                    }
                  }
                })}
              />
              
              <FeatureToggle
                label="Worked Examples Library"
                description="Access to real-world case studies and examples"
                checked={formData?.features.cpd.worked_examples || false}
                onChange={(checked) => setFormData({
                  ...formData!,
                  features: {
                    ...formData!.features,
                    cpd: {
                      ...formData!.features.cpd,
                      worked_examples: checked
                    }
                  }
                })}
              />
              
              <div className="space-y-2">
                <Label htmlFor="webinar_access">Webinar Access Level</Label>
                <select
                  id="webinar_access"
                  className="w-full border rounded-md p-2"
                  value={formData?.features.cpd.webinar_access || 'none'}
                  onChange={(e) => setFormData({
                    ...formData!,
                    features: {
                      ...formData!.features,
                      cpd: {
                        ...formData!.features.cpd,
                        webinar_access: e.target.value
                      }
                    }
                  })}
                >
                  <option value="none">No Access</option>
                  <option value="recorded">Recorded Only</option>
                  <option value="live">Live + Recorded</option>
                </select>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="team_members">Team Members Allowed</Label>
                  <Input 
                    id="team_members"
                    type="number"
                    value={formData?.features.collaboration.team_members || 1}
                    onChange={(e) => setFormData({
                      ...formData!,
                      features: {
                        ...formData!.features,
                        collaboration: {
                          ...formData!.features.collaboration,
                          team_members: Number.parseInt(e.target.value, 10)
                        }
                      }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">Use -1 for unlimited</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* ADVANCED TAB */}
          <TabsContent value="advanced" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Advanced Features</h3>
              
              <FeatureToggle
                label="Client Portal"
                description="Client-facing portal for document upload and status tracking"
                checked={formData?.features.collaboration.client_portal || false}
                onChange={(checked) => setFormData({
                  ...formData!,
                  features: {
                    ...formData!.features,
                    collaboration: {
                      ...formData!.features.collaboration,
                      client_portal: checked
                    }
                  }
                })}
              />
              
              <FeatureToggle
                label="White Label Branding"
                description="Custom branding and letterhead on exports"
                checked={formData?.features.collaboration.white_label || false}
                onChange={(checked) => setFormData({
                  ...formData!,
                  features: {
                    ...formData!.features,
                    collaboration: {
                      ...formData!.features.collaboration,
                      white_label: checked
                    }
                  }
                })}
              />
              
              <FeatureToggle
                label="API Access"
                description="REST API for custom integrations"
                checked={formData?.features.advanced.api_access || false}
                onChange={(checked) => setFormData({
                  ...formData!,
                  features: {
                    ...formData!.features,
                    advanced: {
                      ...formData!.features.advanced,
                      api_access: checked
                    }
                  }
                })}
              />
              
              <FeatureToggle
                label="Custom Integrations"
                description="Bespoke integrations with practice management software"
                checked={formData?.features.advanced.custom_integrations || false}
                onChange={(checked) => setFormData({
                  ...formData!,
                  features: {
                    ...formData!.features,
                    advanced: {
                      ...formData!.features.advanced,
                      custom_integrations: checked
                    }
                  }
                })}
              />
              
              <FeatureToggle
                label="Bulk Operations"
                description="Bulk import/export and batch processing"
                checked={formData?.features.advanced.bulk_operations || false}
                onChange={(checked) => setFormData({
                  ...formData!,
                  features: {
                    ...formData!.features,
                    advanced: {
                      ...formData!.features.advanced,
                      bulk_operations: checked
                    }
                  }
                })}
              />
              
              <div className="space-y-2">
                <Label htmlFor="support_level">Support Level</Label>
                <select
                  id="support_level"
                  className="w-full border rounded-md p-2"
                  value={formData?.features.support.level || 'email'}
                  onChange={(e) => setFormData({
                    ...formData!,
                    features: {
                      ...formData!.features,
                      support: {
                        ...formData!.features.support,
                        level: e.target.value
                      }
                    }
                  })}
                >
                  <option value="community">Community</option>
                  <option value="email">Email</option>
                  <option value="priority">Priority</option>
                  <option value="dedicated">Dedicated Account Manager</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="response_time">Response Time SLA</Label>
                <select
                  id="response_time"
                  className="w-full border rounded-md p-2"
                  value={formData?.features.support.response_time || '48h'}
                  onChange={(e) => setFormData({
                    ...formData!,
                    features: {
                      ...formData!.features,
                      support: {
                        ...formData!.features.support,
                        response_time: e.target.value
                      }
                    }
                  })}
                >
                  <option value="72h">72 hours</option>
                  <option value="48h">48 hours</option>
                  <option value="24h">24 hours</option>
                  <option value="4h">4 hours</option>
                  <option value="1h">1 hour</option>
                </select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
          <Button variant="outline" onClick={() => setFormData(tier)}>
            Reset Changes
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface FeatureToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function FeatureToggle({ label, description, checked, onChange }: FeatureToggleProps) {
  return (
    <div className="flex items-start justify-between p-4 border rounded-lg">
      <div className="space-y-1 flex-1">
        <Label className="text-base font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

