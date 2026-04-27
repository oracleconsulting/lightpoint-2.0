import type { ExtractedMetadata } from './metadataExtraction';

export interface DetectedAnomaly {
  anomalyType: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

export function detectAnomalies(params: {
  text: string;
  metadata: ExtractedMetadata;
  existingEvents?: any[];
}): DetectedAnomaly[] {
  const text = params.text.toLowerCase();
  const anomalies: DetectedAnomaly[] = [];

  if (text.includes('incorrect address') || text.includes('wrong address') || text.includes('not our address')) {
    anomalies.push({
      anomalyType: 'wrong_address',
      description: 'Document appears to mention correspondence being sent to an incorrect address.',
      severity: 'high',
    });
  }

  if (params.metadata.hmrcTeams.length > 2) {
    anomalies.push({
      anomalyType: 'shifting_team',
      description: `Multiple HMRC teams/offices appear in the material: ${params.metadata.hmrcTeams.join(', ')}.`,
      severity: 'medium',
    });
  }

  if (text.includes('cancelled') && text.includes('penalty')) {
    anomalies.push({
      anomalyType: 'erroneous_penalty',
      description: 'Penalty appears to have been issued and then cancelled.',
      severity: 'medium',
    });
  }

  if (text.includes('specific transaction') || text.includes('transaction-level') || text.includes('third party information notice') || text.includes('tpin')) {
    anomalies.push({
      anomalyType: 'particularised_intelligence',
      description: 'HMRC appears to have specific transaction-level intelligence.',
      severity: 'high',
    });
  }

  if (text.includes('sa316') || text.includes('section 8') || text.includes('s.8')) {
    anomalies.push({
      anomalyType: 'returns_under_s8',
      description: 'Document appears to involve returns demanded under s.8 TMA 1970 / SA316.',
      severity: 'medium',
    });
  }

  const passedDeadlines = params.metadata.dates.filter((date) => {
    if (date.role !== 'deadline') return false;
    return new Date(date.date) < new Date();
  });
  if (passedDeadlines.length > 1) {
    anomalies.push({
      anomalyType: 'multiple_deadlines_passed',
      description: `${passedDeadlines.length} extracted deadlines appear to have passed.`,
      severity: 'critical',
    });
  }

  const sortedEventDates = [...(params.existingEvents || []), ...params.metadata.proposedEvents]
    .map((event) => new Date(event.event_date || event.eventDate).getTime())
    .filter((time) => Number.isFinite(time))
    .sort((a, b) => a - b);

  for (let index = 1; index < sortedEventDates.length; index += 1) {
    const gapDays = (sortedEventDates[index] - sortedEventDates[index - 1]) / (1000 * 60 * 60 * 24);
    if (gapDays > 90) {
      anomalies.push({
        anomalyType: 'procedural_delay',
        description: `There appears to be a gap of approximately ${Math.round(gapDays)} days between recorded events.`,
        severity: 'high',
      });
      break;
    }
  }

  return anomalies;
}
