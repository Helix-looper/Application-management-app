import { ApplicationStatus } from '@/types';

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  assessment: 'Assessment',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const ALL_STATUSES: ApplicationStatus[] = [
  'saved', 'applied', 'assessment', 'interview', 'offer', 'rejected', 'withdrawn',
];

export const STATUS_COLORS: Record<ApplicationStatus, { text: string; bg: string }> = {
  saved:      { text: 'var(--color-status-saved)',      bg: 'var(--color-status-saved-bg)' },
  applied:    { text: 'var(--color-status-applied)',    bg: 'var(--color-status-applied-bg)' },
  assessment: { text: 'var(--color-status-assessment)', bg: 'var(--color-status-assessment-bg)' },
  interview:  { text: 'var(--color-status-interview)',  bg: 'var(--color-status-interview-bg)' },
  offer:      { text: 'var(--color-status-offer)',      bg: 'var(--color-status-offer-bg)' },
  rejected:   { text: 'var(--color-status-rejected)',   bg: 'var(--color-status-rejected-bg)' },
  withdrawn:  { text: 'var(--color-status-withdrawn)',  bg: 'var(--color-status-withdrawn-bg)' },
};
