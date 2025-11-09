'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';

interface LetterPreviewProps {
  letter: string;
  onDownload?: () => void;
}

export function LetterPreview({ letter, onDownload }: LetterPreviewProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(letter);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Generated Letter</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-muted p-6 rounded-lg">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {letter}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

