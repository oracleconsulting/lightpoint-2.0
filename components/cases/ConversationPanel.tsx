'use client';

import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { trpc } from '@/lib/trpc/Provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { StructuredOutputChip } from './StructuredOutputChip';

export function ConversationPanel({ caseId }: { caseId: string }) {
  const utils = trpc.useUtils();
  const [message, setMessage] = useState('');
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const { data: history = [] } = trpc.caseChat.history.useQuery({ caseId, limit: 50 });
  const sendMessage = trpc.caseChat.send.useMutation({
    onSuccess: () => {
      setMessage('');
      utils.caseChat.history.invalidate({ caseId, limit: 50 });
      utils.case.get.invalidate(caseId);
    },
  });
  const confirmOutput = trpc.caseChat.confirmStructuredOutput.useMutation({
    onSuccess: () => {
      utils.case.get.invalidate(caseId);
      utils.caseChat.history.invalidate({ caseId, limit: 50 });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessage.mutate({ caseId, message: message.trim() });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-[#2B80FF]" />
          Case Conversation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[560px] space-y-4 overflow-y-auto rounded-lg border bg-gray-50 p-4">
          {history.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Ask about procedural posture, next steps, weaknesses, or what should be recorded in the workspace.
            </p>
          )}
          {history.map((row: any) => (
            <div key={row.id} className={row.role === 'user' ? 'text-right' : 'text-left'}>
              <div
                className={`inline-block max-w-[90%] rounded-lg px-4 py-3 text-sm ${
                  row.role === 'user'
                    ? 'bg-[#2B80FF] text-white'
                    : 'border bg-white text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{row.content}</p>
              </div>
              {Array.isArray(row.structured_outputs) && row.structured_outputs.length > 0 && (
                <div className="mt-3 space-y-2 text-left">
                  {row.structured_outputs.map((output: any, index: number) => {
                    const key = `${row.id}-${index}`;
                    if (dismissed[key]) return null;
                    return (
                      <StructuredOutputChip
                        key={key}
                        output={output}
                        disabled={confirmOutput.isPending}
                        onConfirm={(selected) => confirmOutput.mutate({ caseId, output: selected })}
                        onReject={() => setDismissed((current) => ({ ...current, [key]: true }))}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {sendMessage.isPending && <p className="text-sm text-muted-foreground">Thinking through the case...</p>}
        </div>
        <form onSubmit={handleSend} className="space-y-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about the procedural position, risks, next steps, or what needs recording..."
            rows={4}
          />
          {sendMessage.error && <p className="text-sm text-red-600">{sendMessage.error.message}</p>}
          {confirmOutput.error && <p className="text-sm text-red-600">{confirmOutput.error.message}</p>}
          <Button type="submit" disabled={sendMessage.isPending || !message.trim()}>
            <Send className="mr-2 h-4 w-4" />
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
