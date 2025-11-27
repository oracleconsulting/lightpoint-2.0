// V4 Gamma-Style Theme System
// Configurable colour themes for blog visual layouts

export interface ThemeConfig {
  name: string;
  mode: 'dark' | 'medium' | 'light';
  colors: {
    // Page backgrounds
    pageBg: string;
    pageBgGradient: string;
    
    // Card/component backgrounds
    cardBg: string;
    cardBorder: string;
    
    // Text colors
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    
    // Accent colors
    accentPrimary: string;
    accentSecondary: string;
    accentSuccess: string;
    accentWarning: string;
    accentDanger: string;
  };
}

// 1. Midnight (Ultra Dark)
export const midnightTheme: ThemeConfig = {
  name: 'Midnight',
  mode: 'dark',
  colors: {
    pageBg: '#0a0a1a',
    pageBgGradient: 'linear-gradient(180deg, #0a0a1a 0%, #0f0f23 50%, #1a1a2e 100%)',
    cardBg: 'rgba(26, 26, 46, 0.6)',
    cardBorder: 'rgba(79, 134, 249, 0.2)',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.8)',
    textMuted: 'rgba(255, 255, 255, 0.6)',
    accentPrimary: '#4F86F9',
    accentSecondary: '#00D4FF',
    accentSuccess: '#10B981',
    accentWarning: '#F59E0B',
    accentDanger: '#EF4444'
  }
};

// 2. Slate (Balanced Dark - Recommended)
export const slateTheme: ThemeConfig = {
  name: 'Slate',
  mode: 'dark',
  colors: {
    pageBg: '#1e293b',
    pageBgGradient: 'linear-gradient(180deg, #1e293b 0%, #334155 50%, #475569 100%)',
    cardBg: 'rgba(51, 65, 85, 0.7)',
    cardBorder: 'rgba(148, 163, 184, 0.3)',
    textPrimary: '#F8FAFC',
    textSecondary: '#E2E8F0',
    textMuted: '#94A3B8',
    accentPrimary: '#3B82F6',
    accentSecondary: '#06B6D4',
    accentSuccess: '#22C55E',
    accentWarning: '#EAB308',
    accentDanger: '#EF4444'
  }
};

// 3. Ocean (Medium Dark - More Readable)
export const oceanTheme: ThemeConfig = {
  name: 'Ocean',
  mode: 'medium',
  colors: {
    pageBg: '#0f172a',
    pageBgGradient: 'linear-gradient(180deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
    cardBg: 'rgba(30, 58, 95, 0.8)',
    cardBorder: 'rgba(59, 130, 246, 0.3)',
    textPrimary: '#FFFFFF',
    textSecondary: '#DBEAFE',
    textMuted: '#93C5FD',
    accentPrimary: '#60A5FA',
    accentSecondary: '#38BDF8',
    accentSuccess: '#34D399',
    accentWarning: '#FBBF24',
    accentDanger: '#FB7185'
  }
};

// 4. Professional (Light Mode)
export const professionalTheme: ThemeConfig = {
  name: 'Professional',
  mode: 'light',
  colors: {
    pageBg: '#FFFFFF',
    pageBgGradient: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 50%, #F1F5F9 100%)',
    cardBg: 'rgba(248, 250, 252, 0.9)',
    cardBorder: 'rgba(203, 213, 225, 0.5)',
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    accentPrimary: '#2563EB',
    accentSecondary: '#0891B2',
    accentSuccess: '#059669',
    accentWarning: '#D97706',
    accentDanger: '#DC2626'
  }
};

// 5. Lightpoint Brand (Custom)
export const lightpointTheme: ThemeConfig = {
  name: 'Lightpoint',
  mode: 'dark',
  colors: {
    pageBg: '#0f1729',
    pageBgGradient: 'linear-gradient(180deg, #0f1729 0%, #1a2744 50%, #243b61 100%)',
    cardBg: 'rgba(26, 39, 68, 0.85)',
    cardBorder: 'rgba(79, 134, 249, 0.25)',
    textPrimary: '#FFFFFF',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    accentPrimary: '#4F86F9',      // Lightpoint blue
    accentSecondary: '#F97316',    // Lightpoint orange
    accentSuccess: '#22C55E',
    accentWarning: '#F59E0B',
    accentDanger: '#EF4444'
  }
};

// Theme registry
export const themes: Record<string, ThemeConfig> = {
  midnight: midnightTheme,
  slate: slateTheme,
  ocean: oceanTheme,
  professional: professionalTheme,
  lightpoint: lightpointTheme
};

export type ThemeName = keyof typeof themes;

// Default theme
export const defaultTheme = lightpointTheme;

// Get theme by name with fallback
export function getTheme(name: string): ThemeConfig {
  return themes[name.toLowerCase()] || defaultTheme;
}

// Convert theme to CSS variables
export function themeToCssVars(theme: ThemeConfig): Record<string, string> {
  return {
    '--page-bg': theme.colors.pageBg,
    '--page-bg-gradient': theme.colors.pageBgGradient,
    '--card-bg': theme.colors.cardBg,
    '--card-border': theme.colors.cardBorder,
    '--text-primary': theme.colors.textPrimary,
    '--text-secondary': theme.colors.textSecondary,
    '--text-muted': theme.colors.textMuted,
    '--accent-primary': theme.colors.accentPrimary,
    '--accent-secondary': theme.colors.accentSecondary,
    '--accent-success': theme.colors.accentSuccess,
    '--accent-warning': theme.colors.accentWarning,
    '--accent-danger': theme.colors.accentDanger,
  };
}

// Theme for AI prompt injection
export function getThemePromptVars(themeName: string): Record<string, string> {
  const theme = getTheme(themeName);
  return {
    THEME_NAME: theme.name,
    MODE: theme.mode,
    PAGE_BG: theme.colors.pageBg,
    PAGE_BG_GRADIENT: theme.colors.pageBgGradient,
    CARD_BG: theme.colors.cardBg,
    TEXT_PRIMARY: theme.colors.textPrimary,
    TEXT_SECONDARY: theme.colors.textSecondary,
    ACCENT_PRIMARY: theme.colors.accentPrimary,
  };
}

