// Shared domain types — mirrors Android src/types/index.ts exactly
// Do NOT modify field names or types — Android SQLite schema depends on them

export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'assessment'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

export type EmploymentType =
  | 'full-time'
  | 'part-time'
  | 'contract'
  | 'freelance'
  | 'internship'
  | 'other';

export type WorkArrangement = 'remote' | 'hybrid' | 'on-site';

export type InterviewType =
  | 'hr'
  | 'technical'
  | 'coding-assessment'
  | 'managerial'
  | 'system-design'
  | 'final-round'
  | 'other';

export type InterviewOutcome =
  | 'pending'
  | 'passed'
  | 'failed'
  | 'rescheduled'
  | 'cancelled';

export type ReminderType =
  | 'hr-followup'
  | 'application-deadline'
  | 'interview-reminder'
  | 'assessment-deadline'
  | 'custom';

export interface Company {
  id: string;
  name: string;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
  description?: string | null;
  company_size?: string | null;
  linkedin_url?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  company_id: string;
  company_name?: string;
  job_title: string;
  job_url?: string | null;
  job_description?: string | null;
  location?: string | null;
  employment_type?: EmploymentType | null;
  work_arrangement?: WorkArrangement | null;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string;
  status: ApplicationStatus;
  source?: string | null;
  recruiter_name?: string | null;
  recruiter_email?: string | null;
  recruiter_phone?: string | null;
  recruiter_linkedin?: string | null;
  resume_id?: string | null;
  applied_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Interview {
  id: string;
  application_id: string;
  round_name: string;
  interview_type: InterviewType;
  scheduled_at: string;
  duration_minutes?: number | null;
  interviewer_name?: string | null;
  interviewer_email?: string | null;
  meeting_url?: string | null;
  location?: string | null;
  preparation_notes?: string | null;
  feedback?: string | null;
  outcome: InterviewOutcome;
  created_at: string;
  updated_at: string;
}

export interface ApplicationNote {
  id: string;
  application_id?: string | null;
  company_id?: string | null;
  interview_id?: string | null;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface StatusHistory {
  id: string;
  application_id: string;
  previous_status?: ApplicationStatus | null;
  new_status: ApplicationStatus;
  changed_at: string;
  notes?: string | null;
}

export interface Reminder {
  id: string;
  application_id?: string | null;
  title: string;
  description?: string | null;
  reminder_type: ReminderType;
  remind_at: string;
  notification_enabled: boolean;
  notification_id?: string | null;
  is_completed: boolean;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  company_name?: string | null;
  job_title?: string | null;
}

export interface Resume {
  id: string;
  name: string;
  file_name: string;
  local_file_path: string;
  mime_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
}

export interface AppSetting {
  key: string;
  value: string;
}

export interface BackupData {
  version: number;
  exported_at: string;
  companies: Company[];
  applications: Application[];
  interviews: Interview[];
  notes: ApplicationNote[];
  status_history: StatusHistory[];
  reminders: Reminder[];
  resumes: Resume[];
  settings: Record<string, string>;
}

// Web-specific extended types
export interface ApplicationListItem extends Application {
  company_name: string;
  interview_count: number;
  upcoming_interview_date?: string | null;
}
