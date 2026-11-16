export interface ThemeColors {
  background: string;
  surface: string;
  surface2: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  accent: string;
  accent2: string;
  statusSaved: string;
  statusApplied: string;
  statusAssessment: string;
  statusInterview: string;
  statusOffer: string;
  statusRejected: string;
  statusWithdrawn: string;
  statusSavedBg: string;
  statusAppliedBg: string;
  statusAssessmentBg: string;
  statusInterviewBg: string;
  statusOfferBg: string;
  statusRejectedBg: string;
  statusWithdrawnBg: string;
  error: string;
  success: string;
  warning: string;
  white: string;
  black: string;
  overlay: string;
  tabBar: string;
  tabBarBorder: string;
  cardShadow: string;
}

export const Colors: Record<'light' | 'dark', ThemeColors> = {
  light: {
    background: '#F7F7F2',
    surface: '#FFFFFF',
    surface2: '#F0F1EC',
    textPrimary: '#252B27',
    textSecondary: '#737B74',
    border: '#E5E8E2',
    accent: '#54745D',
    accent2: '#829B83',
    // Status colors
    statusSaved: '#78827B',
    statusApplied: '#4F84B8',
    statusAssessment: '#B57C36',
    statusInterview: '#488A5C',
    statusOffer: '#2E7D52',
    statusRejected: '#B84F4F',
    statusWithdrawn: '#7D8C83',
    // Status backgrounds
    statusSavedBg: '#ECEEE9',
    statusAppliedBg: '#E8F1F9',
    statusAssessmentBg: '#FAF2E6',
    statusInterviewBg: '#E7F3EB',
    statusOfferBg: '#E2F2E9',
    statusRejectedBg: '#F9EAE9',
    statusWithdrawnBg: '#ECEFEA',
    // Feedback
    error: '#B84F4F',
    success: '#488A5C',
    warning: '#B57C36',
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(0,0,0,0.45)',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E5E8E2',
    cardShadow: 'rgba(0,0,0,0.04)',
  },
  dark: {
    background: '#191D1A',
    surface: '#222824',
    surface2: '#2A322D',
    textPrimary: '#EDF0EA',
    textSecondary: '#A1AAA1',
    border: '#363E38',
    accent: '#94B39A',
    accent2: '#78917B',
    // Status colors
    statusSaved: '#9EA8A1',
    statusApplied: '#6B9BC7',
    statusAssessment: '#D49A4C',
    statusInterview: '#64AC7A',
    statusOffer: '#4EAA73',
    statusRejected: '#C96565',
    statusWithdrawn: '#92A398',
    // Status backgrounds
    statusSavedBg: '#28302A',
    statusAppliedBg: '#1D2E3C',
    statusAssessmentBg: '#362B1D',
    statusInterviewBg: '#1E3626',
    statusOfferBg: '#1B3825',
    statusRejectedBg: '#392121',
    statusWithdrawnBg: '#252F28',
    // Feedback
    error: '#C96565',
    success: '#64AC7A',
    warning: '#D49A4C',
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(0,0,0,0.7)',
    tabBar: '#222824',
    tabBarBorder: '#363E38',
    cardShadow: 'rgba(0,0,0,0.2)',
  },
};

export const Typography = {
  screenHeading: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  sectionHeading: { fontSize: 18, fontWeight: '600' as const, letterSpacing: -0.2 },
  cardTitle: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyMedium: { fontSize: 15, fontWeight: '500' as const },
  bodySemibold: { fontSize: 15, fontWeight: '600' as const },
  secondary: { fontSize: 13, fontWeight: '400' as const },
  secondaryMedium: { fontSize: 13, fontWeight: '500' as const },
  small: { fontSize: 12, fontWeight: '400' as const },
  smallMedium: { fontSize: 12, fontWeight: '500' as const },
  label: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.3 },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  screenPadding: 16,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
} as const;
