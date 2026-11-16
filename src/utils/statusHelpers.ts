import { ApplicationStatus, InterviewType, InterviewOutcome, ReminderType } from '@/types';
import { Colors } from '@/theme';

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
  'saved',
  'applied',
  'assessment',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
];

export function getStatusColor(status: ApplicationStatus, theme: 'light' | 'dark'): string {
  const c = Colors[theme];
  const map: Record<ApplicationStatus, string> = {
    saved: c.statusSaved,
    applied: c.statusApplied,
    assessment: c.statusAssessment,
    interview: c.statusInterview,
    offer: c.statusOffer,
    rejected: c.statusRejected,
    withdrawn: c.statusWithdrawn,
  };
  return map[status] || c.statusSaved;
}

export function getStatusBgColor(status: ApplicationStatus, theme: 'light' | 'dark'): string {
  const c = Colors[theme];
  const map: Record<ApplicationStatus, string> = {
    saved: c.statusSavedBg,
    applied: c.statusAppliedBg,
    assessment: c.statusAssessmentBg,
    interview: c.statusInterviewBg,
    offer: c.statusOfferBg,
    rejected: c.statusRejectedBg,
    withdrawn: c.statusWithdrawnBg,
  };
  return map[status] || c.statusSavedBg;
}

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  hr: 'HR Screen',
  technical: 'Technical',
  'coding-assessment': 'Coding Test',
  managerial: 'Managerial',
  'system-design': 'System Design',
  'final-round': 'Final Round',
  other: 'Interview',
};

export const INTERVIEW_OUTCOME_LABELS: Record<InterviewOutcome, string> = {
  pending: 'Pending',
  passed: 'Passed',
  failed: 'Not Moving Forward',
  rescheduled: 'Rescheduled',
  cancelled: 'Cancelled',
};

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  'hr-followup': 'HR Follow-up',
  'application-deadline': 'Application Deadline',
  'interview-reminder': 'Interview Reminder',
  'assessment-deadline': 'Assessment Due',
  custom: 'Task',
};
