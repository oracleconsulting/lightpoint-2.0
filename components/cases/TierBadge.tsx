import { Badge } from '@/components/ui/badge';

export function TierBadge({ tier }: { tier?: number | null }) {
  const label = `Tier ${tier || 3}`;
  if (tier === 1) {
    return <Badge className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50">{label}</Badge>;
  }
  if (tier === 2) {
    return <Badge className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">{label}</Badge>;
  }
  return <Badge className="border-red-200 bg-red-50 text-red-700 hover:bg-red-50">{label}</Badge>;
}
