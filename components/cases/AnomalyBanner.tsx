import { AlertTriangle } from 'lucide-react';

interface AnomalyBannerProps {
  anomalies?: Array<{
    id: string;
    anomaly_type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

export function AnomalyBanner({ anomalies = [] }: AnomalyBannerProps) {
  if (!anomalies.length) return null;

  const highest = anomalies.some((a) => a.severity === 'critical')
    ? 'critical'
    : anomalies.some((a) => a.severity === 'high')
      ? 'high'
      : 'medium';

  const colour =
    highest === 'critical'
      ? 'border-red-300 bg-red-50 text-red-900'
      : highest === 'high'
        ? 'border-orange-300 bg-orange-50 text-orange-900'
        : 'border-amber-300 bg-amber-50 text-amber-900';

  return (
    <div className={`rounded-lg border p-4 ${colour}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5" />
        <div>
          <h2 className="font-semibold">Open case anomalies</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {anomalies.slice(0, 4).map((anomaly) => (
              <li key={anomaly.id}>
                <span className="font-medium">{anomaly.anomaly_type.replace(/_/g, ' ')}</span>: {anomaly.description}
              </li>
            ))}
          </ul>
          {anomalies.length > 4 && (
            <p className="mt-2 text-sm">{anomalies.length - 4} more anomaly records are open.</p>
          )}
        </div>
      </div>
    </div>
  );
}
