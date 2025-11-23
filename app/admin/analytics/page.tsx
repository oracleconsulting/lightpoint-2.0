'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/Provider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart3, TrendingUp, RefreshCw, Database, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { data: platformStats } = trpc.analytics.getPlatformStats.useQuery();
  const recordOutcome = trpc.analytics.recordComplaintOutcome.useMutation();

  // Form state
  const [formData, setFormData] = useState({
    complaintId: '',
    organizationId: '',
    complaintType: 'vat' as const,
    clientType: 'ltd_company' as const,
    status: 'successful' as const,
    feesRecovered: 0,
    exGratiaAmount: 0,
    durationDays: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRecording(true);
    setError('');
    setSuccess(false);

    try {
      await recordOutcome.mutateAsync(formData);
      setSuccess(true);
      
      // Reset form
      setFormData({
        complaintId: '',
        organizationId: '',
        complaintType: 'vat',
        clientType: 'ltd_company',
        status: 'successful',
        feesRecovered: 0,
        exGratiaAmount: 0,
        durationDays: 0,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to record outcome');
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Database className="h-8 w-8 text-blue-600" />
          Analytics Management
        </h1>
        <p className="text-gray-600">
          Monitor platform statistics and record complaint outcomes
        </p>
      </div>

      {/* Current Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600">Success Rate</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {platformStats?.success_rate?.value?.toFixed(1) || 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">Total Recovered</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              £{((platformStats?.total_fees_recovered?.value || 0) / 1000).toFixed(0)}k
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-gray-600">Total Cases</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {platformStats?.total_complaints?.value || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              <span className="text-sm text-gray-600">Avg Recovery</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              £{platformStats?.avg_fee_recovery?.value?.toFixed(0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Record Complaint Outcome */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Record Complaint Outcome
          </CardTitle>
        </CardHeader>
        <CardContent>
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-800">
                Complaint outcome recorded successfully! Platform stats will update momentarily.
              </span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="complaintId">Complaint ID</Label>
                <Input
                  id="complaintId"
                  type="text"
                  value={formData.complaintId}
                  onChange={(e) => setFormData({ ...formData, complaintId: e.target.value })}
                  placeholder="UUID of complaint"
                  required
                />
              </div>

              <div>
                <Label htmlFor="organizationId">Organization ID</Label>
                <Input
                  id="organizationId"
                  type="text"
                  value={formData.organizationId}
                  onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                  placeholder="UUID of organization"
                  required
                />
              </div>

              <div>
                <Label htmlFor="complaintType">Complaint Type</Label>
                <select
                  id="complaintType"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.complaintType}
                  onChange={(e) => setFormData({ ...formData, complaintType: e.target.value as any })}
                >
                  <option value="paye">PAYE</option>
                  <option value="vat">VAT</option>
                  <option value="sa">Self Assessment</option>
                  <option value="ct">Corporation Tax</option>
                  <option value="cis">CIS</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="clientType">Client Type</Label>
                <select
                  id="clientType"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.clientType}
                  onChange={(e) => setFormData({ ...formData, clientType: e.target.value as any })}
                >
                  <option value="sole_trader">Sole Trader</option>
                  <option value="partnership">Partnership</option>
                  <option value="ltd_company">Limited Company</option>
                  <option value="llp">LLP</option>
                  <option value="charity">Charity</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="status">Outcome Status</Label>
                <select
                  id="status"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="successful">Successful</option>
                  <option value="unsuccessful">Unsuccessful</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>

              <div>
                <Label htmlFor="durationDays">Duration (Days)</Label>
                <Input
                  id="durationDays"
                  type="number"
                  value={formData.durationDays}
                  onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 0 })}
                  placeholder="e.g., 45"
                />
              </div>

              <div>
                <Label htmlFor="feesRecovered">Fees Recovered (£)</Label>
                <Input
                  id="feesRecovered"
                  type="number"
                  step="0.01"
                  value={formData.feesRecovered}
                  onChange={(e) => setFormData({ ...formData, feesRecovered: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 2450.00"
                />
              </div>

              <div>
                <Label htmlFor="exGratiaAmount">Ex-Gratia Amount (£)</Label>
                <Input
                  id="exGratiaAmount"
                  type="number"
                  step="0.01"
                  value={formData.exGratiaAmount}
                  onChange={(e) => setFormData({ ...formData, exGratiaAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 500.00"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData({
                  complaintId: '',
                  organizationId: '',
                  complaintType: 'vat',
                  clientType: 'ltd_company',
                  status: 'successful',
                  feesRecovered: 0,
                  exGratiaAmount: 0,
                  durationDays: 0,
                })}
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={isRecording}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRecording ? 'Recording...' : 'Record Outcome'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">💡 How It Works</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Record complaint outcomes as they're resolved</li>
            <li>• Platform statistics update automatically via database triggers</li>
            <li>• Homepage stats refresh every 60 seconds for all visitors</li>
            <li>• Individual firm dashboards show their specific metrics</li>
            <li>• Benchmarking compares firm performance against platform averages</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

