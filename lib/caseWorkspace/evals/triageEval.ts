import { classifyTier } from '../triage';

export function evaluateThorntonTriageShape() {
  const result = classifyTier({
    metadata: {
      hmrcTeams: ['Compliance', 'Debt Management', 'Self Assessment'],
    },
    anomalies: [
      { anomalyType: 'wrong_address', severity: 'high' },
      { anomalyType: 'erroneous_penalty', severity: 'medium' },
      { anomalyType: 'procedural_delay', severity: 'high' },
      { anomalyType: 'shifting_team', severity: 'medium' },
      { anomalyType: 'multiple_deadlines_passed', severity: 'critical' },
      { anomalyType: 'particularised_intelligence', severity: 'high' },
      { anomalyType: 'returns_under_s8', severity: 'medium' },
    ],
  });

  return {
    passed: result.tier === 3
      && result.flags.includes('multiple_hmrc_teams')
      && result.flags.includes('passed_deadlines')
      && result.flags.includes('tpin_evidence'),
    result,
  };
}
