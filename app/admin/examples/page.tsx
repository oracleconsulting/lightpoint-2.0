'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Plus, Trash2, Eye, EyeOff, Code, DollarSign, TrendingUp } from 'lucide-react';

interface WorkedExample {
  id: string;
  title: string;
  caseType: string;
  description: string;
  challenge: string;
  solution: string;
  outcome: string;
  amountRecovered: number;
  duration: number; // days
  tier: string;
  isPublished: boolean;
}

export default function WorkedExamplesManagement() {
  const [examples, setExamples] = useState<WorkedExample[]>([
    {
      id: '1',
      title: 'VAT Penalty Dispute - £15,240 Recovered',
      caseType: 'VAT Dispute',
      description: 'Client incorrectly penalized for late VAT payment despite HMRC processing delays',
      challenge: 'HMRC applied £15,240 in penalties despite evidence of timely submission',
      solution: 'Documented charter breaches, provided submission timestamps, escalated to Tier 2',
      outcome: 'Full penalty reversal + £500 ex-gratia payment for distress',
      amountRecovered: 15240,
      duration: 74,
      tier: 'Professional',
      isPublished: true,
    },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<WorkedExample>>({});

  const caseTypes = ['VAT Dispute', 'Self Assessment', 'Corporation Tax', 'PAYE', 'CIS', 'Charter Breach', 'Other'];
  const tiers = ['Free', 'Professional', 'Enterprise'];

  const handleEdit = (example: WorkedExample) => {
    setEditingId(example.id);
    setFormData(example);
  };

  const handleSave = () => {
    if (editingId && editingId !== 'new') {
      setExamples(examples.map(e => e.id === editingId ? { ...e, ...formData } as WorkedExample : e));
      setEditingId(null);
      setFormData({});
    }
  };

  const handleAdd = () => {
    const newExample: WorkedExample = {
      id: Date.now().toString(),
      title: formData.title || 'Untitled Case',
      caseType: formData.caseType || 'VAT Dispute',
      description: formData.description || '',
      challenge: formData.challenge || '',
      solution: formData.solution || '',
      outcome: formData.outcome || '',
      amountRecovered: formData.amountRecovered || 0,
      duration: formData.duration || 30,
      tier: formData.tier || 'Professional',
      isPublished: false,
    };
    setExamples([newExample, ...examples]);
    setFormData({});
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this example?')) {
      setExamples(examples.filter(e => e.id !== id));
    }
  };

  const togglePublish = (id: string) => {
    setExamples(examples.map(e => 
      e.id === id ? { ...e, isPublished: !e.isPublished } : e
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900">Worked Examples</h1>
          <p className="text-gray-600 mt-2">Real case studies and success stories</p>
        </div>
        <Button onClick={() => setEditingId('new')} className="gap-2">
          <Plus className="h-4 w-4" />
          New Example
        </Button>
      </div>

      {/* Editor */}
      {(editingId === 'new' || editingId) && (
        <Card className="border-brand-gold/30 shadow-lg">
          <CardHeader>
            <CardTitle>{editingId === 'new' ? 'Create Case Study' : 'Edit Case Study'}</CardTitle>
            <CardDescription>Document successful complaint resolutions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                placeholder="e.g., VAT Penalty Dispute - £15K Recovered"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Case Type</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  value={formData.caseType || ''}
                  onChange={(e) => setFormData({ ...formData, caseType: e.target.value })}
                >
                  {caseTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                placeholder="Brief overview of the case..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Challenge</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                placeholder="What was the problem? What made it difficult?"
                value={formData.challenge || ''}
                onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Solution</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                placeholder="How was it resolved? What strategies were used?"
                value={formData.solution || ''}
                onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Outcome</label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                placeholder="Final result and key learnings..."
                value={formData.outcome || ''}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount Recovered (£)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  value={formData.amountRecovered || ''}
                  onChange={(e) => setFormData({ ...formData, amountRecovered: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  value={formData.duration || ''}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => { setEditingId(null); setFormData({}); }}>
                Cancel
              </Button>
              <Button onClick={editingId === 'new' ? handleAdd : handleSave}>
                <Save className="h-4 w-4 mr-2" />
                {editingId === 'new' ? 'Create' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Examples Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {examples.map((example) => (
          <Card key={example.id} className={`${!example.isPublished ? 'opacity-60' : ''} hover:shadow-lg transition-shadow`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {example.isPublished ? (
                    <Eye className="h-4 w-4 text-brand-gold" aria-label="Published" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" aria-label="Draft" />
                  )}
                  <span className="text-xs px-2 py-1 rounded-button bg-brand-blurple/10 text-brand-blurple">
                    {example.caseType}
                  </span>
                </div>
                <Code className="h-5 w-5 text-brand-gold" />
              </div>

              <h3 className="font-heading text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {example.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{example.description}</p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-brand-gold/10 rounded-button p-3">
                  <div className="flex items-center gap-1 text-brand-gold mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs font-medium">Recovered</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    £{example.amountRecovered.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-button p-3">
                  <div className="flex items-center gap-1 text-gray-600 mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium">Duration</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {example.duration} days
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePublish(example.id)}
                  className="flex-1"
                >
                  {example.isPublished ? 'Unpublish' : 'Publish'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(example)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(example.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {examples.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No worked examples yet</p>
            <Button onClick={() => setEditingId('new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Example
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
