import { BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ResearchPanelProps {
  research?: any[];
}

export function ResearchPanel({ research = [] }: ResearchPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#D4A84B]" />
          Research Bank
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {research.length === 0 && (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Research capture and citation verification come in later phases.
          </p>
        )}
        {research.map((item) => (
          <div key={item.id} className="rounded-lg border bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-gray-900">{item.title}</p>
              <Badge variant="outline">{item.verification_status}</Badge>
            </div>
            {item.proposition && <p className="mt-2 text-sm text-gray-700">{item.proposition}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
