'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FileText,
  TrendingUp,
  GitMerge,
  Plus,
  Ban
} from 'lucide-react';

interface ComparisonResult {
  duplicates: Array<{
    kb_id: string;
    title: string;
    similarity: number;
    recommendation: string;
    reason: string;
  }>;
  overlaps: Array<{
    kb_id: string;
    title: string;
    similarity: number;
    overlap_percentage: number;
    overlap_sections: string[];
    recommendation: string;
    reason: string;
  }>;
  new_information: Array<{
    category: string;
    topic: string;
    content: string;
    confidence: number;
    importance: string;
  }>;
  gaps_filled: Array<{
    existing_kb_id: string;
    gap_description: string;
    fills_gap: boolean;
    impact: string;
  }>;
  conflicts: Array<{
    kb_id: string;
    conflict_type: string;
    description: string;
    severity: string;
    resolution_needed: boolean;
  }>;
  recommendations: {
    action: string;
    confidence: number;
    reason: string;
    suggested_category?: string;
    suggested_title?: string;
    merge_targets?: string[];
  };
}

interface DocumentComparisonProps {
  filename: string;
  comparison: ComparisonResult;
  onApprove: () => void;
  onReject: () => void;
  isProcessing?: boolean;
}

export default function DocumentComparison({
  filename,
  comparison,
  onApprove,
  onReject,
  isProcessing = false,
}: DocumentComparisonProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'add': return <Plus className="h-5 w-5 text-green-600" />;
      case 'merge': return <GitMerge className="h-5 w-5 text-blue-600" />;
      case 'skip': return <Ban className="h-5 w-5 text-gray-600" />;
      case 'replace': return <TrendingUp className="h-5 w-5 text-orange-600" />;
      default: return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'add': return 'bg-green-100 text-green-800 border-green-300';
      case 'merge': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'skip': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'replace': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle className="text-lg">{filename}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {getActionIcon(comparison.recommendations.action)}
                <Badge className={`${getActionColor(comparison.recommendations.action)} border`}>
                  {comparison.recommendations.action.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {(comparison.recommendations.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onReject}
              disabled={isProcessing}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={onApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve & Add
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Recommendation */}
        <div className={`p-4 rounded-lg border ${getActionColor(comparison.recommendations.action)}`}>
          <p className="font-medium mb-2">AI Recommendation:</p>
          <p className="text-sm">{comparison.recommendations.reason}</p>
          {comparison.recommendations.suggested_category && (
            <p className="text-sm mt-2">
              <strong>Suggested Category:</strong> {comparison.recommendations.suggested_category}
            </p>
          )}
        </div>

        {/* Duplicates */}
        {comparison.duplicates.length > 0 && (
          <div className="border rounded-lg p-4 bg-red-50">
            <h3 className="font-medium text-red-900 mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Duplicates Found ({comparison.duplicates.length})
            </h3>
            <div className="space-y-2">
              {comparison.duplicates.map((dup, index) => (
                <div key={index} className="bg-white rounded p-3 border border-red-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{dup.title}</span>
                    <Badge variant="outline">{(dup.similarity * 100).toFixed(0)}% similar</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{dup.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overlaps */}
        {comparison.overlaps.length > 0 && (
          <div className="border rounded-lg p-4 bg-blue-50">
            <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
              <GitMerge className="h-5 w-5" />
              Overlaps Detected ({comparison.overlaps.length})
            </h3>
            <div className="space-y-2">
              {comparison.overlaps.map((overlap, index) => (
                <div key={index} className="bg-white rounded p-3 border border-blue-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{overlap.title}</span>
                    <Badge variant="outline">{overlap.overlap_percentage}% overlap</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{overlap.reason}</p>
                  {overlap.overlap_sections.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {overlap.overlap_sections.map((section, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {section}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Information */}
        {comparison.new_information.length > 0 && (
          <div className="border rounded-lg p-4 bg-green-50">
            <h3 className="font-medium text-green-900 mb-3 flex items-center gap-2">
              <Plus className="h-5 w-5" />
              New Information ({comparison.new_information.length})
            </h3>
            <div className="space-y-2">
              {comparison.new_information.slice(0, 3).map((info, index) => (
                <div key={index} className="bg-white rounded p-3 border border-green-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{info.topic}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">{info.category}</Badge>
                      <Badge variant="outline" className={`text-xs ${
                        info.importance === 'high' ? 'border-red-500 text-red-700' :
                        info.importance === 'medium' ? 'border-yellow-500 text-yellow-700' :
                        'border-gray-500 text-gray-700'
                      }`}>
                        {info.importance}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{info.content.substring(0, 150)}...</p>
                </div>
              ))}
              {comparison.new_information.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{comparison.new_information.length - 3} more items
                </p>
              )}
            </div>
          </div>
        )}

        {/* Gaps Filled */}
        {comparison.gaps_filled.length > 0 && (
          <div className="border rounded-lg p-4 bg-purple-50">
            <h3 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Gaps Filled ({comparison.gaps_filled.length})
            </h3>
            <div className="space-y-2">
              {comparison.gaps_filled.map((gap, index) => (
                <div key={index} className="bg-white rounded p-3 border border-purple-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{gap.gap_description}</span>
                    <Badge variant="outline" className="text-xs">{gap.impact} impact</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conflicts */}
        {comparison.conflicts.length > 0 && (
          <div className="border rounded-lg p-4 bg-orange-50">
            <h3 className="font-medium text-orange-900 mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Conflicts Detected ({comparison.conflicts.length})
            </h3>
            <div className="space-y-2">
              {comparison.conflicts.map((conflict, index) => (
                <div key={index} className="bg-white rounded p-3 border border-orange-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{conflict.conflict_type}</span>
                    <Badge variant="outline" className={`text-xs ${
                      conflict.severity === 'high' ? 'border-red-500 text-red-700' :
                      conflict.severity === 'medium' ? 'border-yellow-500 text-yellow-700' :
                      'border-gray-500 text-gray-700'
                    }`}>
                      {conflict.severity} severity
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{conflict.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

