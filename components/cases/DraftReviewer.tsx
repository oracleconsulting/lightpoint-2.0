import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DraftReviewer({ review }: { review?: string | null }) {
  if (!review) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Devil&apos;s advocate review</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm text-gray-700">{review}</p>
      </CardContent>
    </Card>
  );
}
