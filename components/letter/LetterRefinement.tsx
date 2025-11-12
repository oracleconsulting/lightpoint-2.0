'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RefreshCw, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LetterRefinementProps {
  onRefine: (additionalContext: string) => void;
  isRefining?: boolean;
}

export function LetterRefinement({ onRefine, isRefining = false }: LetterRefinementProps) {
  const [refinementContext, setRefinementContext] = useState('');

  const handleRefine = () => {
    if (refinementContext.trim()) {
      onRefine(refinementContext);
      setRefinementContext(''); // Clear after submission
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-blue-600" />
          Refine Letter with Additional Context
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-900">
            Found new information after generating the letter? Add it here to regenerate the letter with updated details.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="refinement-context">
            Additional Information
          </Label>
          <Textarea
            id="refinement-context"
            placeholder="Example:
• Part of the £34,000 claim has already been repaid (specify amount and date)
• Client provided additional correspondence not previously uploaded
• New dates or reference numbers discovered
• Updated financial impact information
• Client's business circumstances or health impact
• Specific HMRC promises or commitments made"
            value={refinementContext}
            onChange={(e) => setRefinementContext(e.target.value)}
            rows={6}
            disabled={isRefining}
            className="resize-none bg-white"
          />
          <p className="text-xs text-muted-foreground">
            The system will re-analyze the complaint with this new context and regenerate the letter accordingly.
          </p>
        </div>

        <Button
          onClick={handleRefine}
          disabled={!refinementContext.trim() || isRefining}
          className="w-full"
          size="lg"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefining ? 'animate-spin' : ''}`} />
          {isRefining ? 'Re-analyzing & Regenerating...' : 'Re-analyze & Regenerate Letter'}
        </Button>
      </CardContent>
    </Card>
  );
}

