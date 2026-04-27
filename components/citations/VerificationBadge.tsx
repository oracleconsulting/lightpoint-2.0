import { Badge } from '@/components/ui/badge';

export function VerificationBadge({ status }: { status?: string | null }) {
  if (status === 'verified') {
    return <Badge className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50">Verified</Badge>;
  }
  if (status === 'manual_check_required') {
    return <Badge className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">Manual check</Badge>;
  }
  if (status === 'failed') {
    return <Badge className="border-red-200 bg-red-50 text-red-700 hover:bg-red-50">Not found</Badge>;
  }
  return <Badge variant="outline">Pending</Badge>;
}
