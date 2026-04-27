export interface CaseWorkspacePreferences {
  defaultTier: 1 | 2 | 3;
  requireCitationVerification: boolean;
  exportSignatureBlock?: string;
  toneProfile: 'james_direct' | 'formal';
}

export const DEFAULT_CASE_WORKSPACE_PREFERENCES: CaseWorkspacePreferences = {
  defaultTier: 3,
  requireCitationVerification: true,
  toneProfile: 'james_direct',
};

export function mergeCaseWorkspacePreferences(
  overrides?: Partial<CaseWorkspacePreferences> | null
): CaseWorkspacePreferences {
  return {
    ...DEFAULT_CASE_WORKSPACE_PREFERENCES,
    ...(overrides || {}),
  };
}
