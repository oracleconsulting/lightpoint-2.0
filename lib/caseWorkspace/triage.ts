export interface TriageResult {
  tier: 1 | 2 | 3;
  flags: string[];
}

export function classifyTier(workspace: {
  anomalies?: Array<{ anomaly_type?: string; anomalyType?: string; severity?: string }>;
  metadata?: {
    hmrcTeams?: string[];
  };
}): TriageResult {
  let tier: 1 | 2 | 3 = 1;
  const flags: string[] = [];
  const anomalies = workspace.anomalies || [];
  const anomalyTypes = anomalies.map((a) => a.anomaly_type || a.anomalyType);

  if ((workspace.metadata?.hmrcTeams || []).length > 2 || anomalyTypes.includes('shifting_team')) {
    tier = 3;
    flags.push('multiple_hmrc_teams');
  }
  if (anomalyTypes.includes('multiple_deadlines_passed')) {
    tier = 3;
    flags.push('passed_deadlines');
  }
  if (anomalyTypes.includes('particularised_intelligence')) {
    tier = 3;
    flags.push('tpin_evidence');
  }
  if (anomalies.filter((a) => a.severity === 'high' || a.severity === 'critical').length >= 2) {
    tier = 3;
    flags.push('procedural_complexity');
  }
  if (anomalyTypes.includes('returns_under_s8')) {
    tier = Math.max(tier, 2) as 1 | 2 | 3;
    flags.push('para_21_engaged');
  }
  if (anomalyTypes.includes('wrong_address')) {
    tier = Math.max(tier, 2) as 1 | 2 | 3;
    flags.push('address_anomaly');
  }
  if (anomalyTypes.includes('procedural_delay')) {
    tier = Math.max(tier, 2) as 1 | 2 | 3;
    flags.push('procedural_delays');
  }

  return { tier, flags };
}
