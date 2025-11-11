'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, FileText, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

interface OCRFailureCardProps {
  document: any;
  onRetryOCR: (documentId: string) => void;
  isRetrying?: boolean;
}

export function OCRFailureCard({ document, onRetryOCR, isRetrying = false }: OCRFailureCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Check if this is an OCR failure
  const isOCRFailure = 
    document?.processed_data?.text?.includes('OCR failed') ||
    document?.processed_data?.text?.includes("I don't see an image") ||
    document?.processed_data?.text?.length < 50;

  if (!isOCRFailure) {
    return null;
  }

  const isImage = document?.file_type?.toLowerCase().includes('image') ||
                  ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff'].some((ext: string) => 
                    document?.filename?.toLowerCase().endsWith(`.${ext}`)
                  );

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <CardTitle className="text-lg">OCR Processing Failed</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Unable to extract text from: <strong>{document?.filename}</strong>
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
            {isImage ? 'Image' : 'Document'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Possible causes */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Possible Causes:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Image quality too low or blurry</li>
            <li>Text too small or poorly scanned</li>
            <li>Handwritten text (not machine-readable)</li>
            <li>Document orientation incorrect (rotated/upside-down)</li>
            <li>Image upload incomplete or corrupted</li>
            <li>API rate limit or temporary service issue</li>
          </ul>
        </div>

        {/* Recommendations */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Recommendations:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span><strong>Re-photograph:</strong> Take a new photo in good lighting with the document flat and all text visible</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span><strong>Scan as PDF:</strong> Use a scanner or scanning app to create a high-quality PDF</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span><strong>Check orientation:</strong> Ensure document is right-side up and not rotated</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span><strong>Increase resolution:</strong> Use at least 300 DPI for scanned documents</span>
            </li>
          </ul>
        </div>

        {/* Error details (expandable) */}
        {document?.processed_data?.text && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs"
            >
              {showDetails ? 'Hide' : 'Show'} Error Details
            </Button>
            {showDetails && (
              <div className="p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
                {document.processed_data.text}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onRetryOCR(document.id)}
            disabled={isRetrying}
            variant="default"
            size="sm"
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying OCR...' : 'Retry OCR Processing'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground border-t pt-3 mt-3">
          <strong>Tip:</strong> If retrying doesn't work, delete this document and upload a better quality version. 
          The analysis cannot proceed without readable text content.
        </p>
      </CardContent>
    </Card>
  );
}

