import { evaluateTone } from './toneEval';
import { evaluateThorntonTriageShape } from './triageEval';

export async function runCaseWorkspaceSmokeEvals(sampleOutput: string) {
  const tone = evaluateTone(sampleOutput);
  const thorntonTriage = evaluateThorntonTriageShape();

  return {
    passed: tone.passed && thorntonTriage.passed,
    tone,
    thorntonTriage,
    note: 'Citation evals require network access to BAILII and a configured Supabase cache.',
  };
}
