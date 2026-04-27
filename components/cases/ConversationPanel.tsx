import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function ConversationPanel() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-[#2B80FF]" />
          Case Conversation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-dashed bg-gray-50 p-4 text-sm text-muted-foreground">
          Chat is intentionally a placeholder in Phase 1. Phase 2 will add workspace-aware AI with structured outputs.
        </div>
        <Textarea disabled placeholder="Workspace chat comes in Phase 2" />
        <Button disabled>Send</Button>
      </CardContent>
    </Card>
  );
}
