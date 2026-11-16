import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { BackupData, Company, Application, Interview, ApplicationNote, StatusHistory, Reminder, Resume } from '@/types';
import { getDatabase } from '../database';
import { nowISO } from '@/utils/helpers';
import dayjs from 'dayjs';

export async function exportBackupData(): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const db = await getDatabase();

    const [companies, applications, interviews, notes, status_history, reminders, resumes, settingsRows] =
      await Promise.all([
        db.getAllAsync<Company>('SELECT * FROM companies;'),
        db.getAllAsync<Application>('SELECT * FROM applications;'),
        db.getAllAsync<Interview>('SELECT * FROM interviews;'),
        db.getAllAsync<ApplicationNote>('SELECT * FROM application_notes;'),
        db.getAllAsync<StatusHistory>('SELECT * FROM status_history;'),
        db.getAllAsync<Reminder>('SELECT * FROM reminders;'),
        db.getAllAsync<Resume>('SELECT * FROM resumes;'),
        db.getAllAsync<{ key: string; value: string }>('SELECT * FROM app_settings;'),
      ]);

    const settings: Record<string, string> = {};
    for (const row of settingsRows) {
      settings[row.key] = row.value;
    }

    const backup: BackupData = {
      version: 1,
      exported_at: nowISO(),
      companies,
      applications,
      interviews,
      notes,
      status_history,
      reminders,
      resumes,
      settings,
    };

    const dateStr = dayjs().format('YYYY-MM-DD_HH-mm');
    const fileName = `jobpilot_backup_${dateStr}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backup, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return { success: true, filePath };
  } catch (err: any) {
    return { success: false, error: err.message || 'Export failed' };
  }
}

export async function shareBackupFile(filePath: string): Promise<boolean> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: 'Export JobPilot Backup',
      UTI: 'public.json',
    });
    return true;
  }
  return false;
}

export function validateBackupContent(content: string): { valid: boolean; data?: BackupData; error?: string } {
  try {
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Backup file is not a valid JSON object' };
    }
    if (!parsed.version || typeof parsed.version !== 'number') {
      return { valid: false, error: 'Invalid backup: missing version identifier' };
    }
    if (!Array.isArray(parsed.companies) || !Array.isArray(parsed.applications)) {
      return { valid: false, error: 'Invalid backup structure: missing companies or applications list' };
    }
    return { valid: true, data: parsed as BackupData };
  } catch (e: any) {
    return { valid: false, error: 'Could not parse JSON: ' + (e.message || 'Syntax error') };
  }
}

export async function restoreBackupData(backup: BackupData): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
      // Clear current data safely
      await db.execAsync(`
        PRAGMA foreign_keys = OFF;
        DELETE FROM application_notes;
        DELETE FROM interviews;
        DELETE FROM reminders;
        DELETE FROM status_history;
        DELETE FROM applications;
        DELETE FROM companies;
        DELETE FROM resumes;
      `);

      // 1. Companies
      for (const c of backup.companies) {
        await db.runAsync(
          `INSERT INTO companies (id, name, website, industry, location, description, company_size, linkedin_url, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [c.id, c.name, c.website ?? null, c.industry ?? null, c.location ?? null, c.description ?? null, c.company_size ?? null, c.linkedin_url ?? null, c.notes ?? null, c.created_at, c.updated_at]
        );
      }

      // 2. Resumes
      for (const r of backup.resumes || []) {
        await db.runAsync(
          `INSERT INTO resumes (id, name, file_name, local_file_path, mime_type, file_size, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [r.id, r.name, r.file_name, r.local_file_path, r.mime_type, r.file_size || 0, r.created_at, r.updated_at]
        );
      }

      // 3. Applications
      for (const a of backup.applications) {
        await db.runAsync(
          `INSERT INTO applications (
            id, company_id, job_title, job_url, job_description, location,
            employment_type, work_arrangement, salary_min, salary_max, currency,
            status, source, recruiter_name, recruiter_email, recruiter_phone,
            recruiter_linkedin, resume_id, applied_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            a.id, a.company_id, a.job_title, a.job_url ?? null, a.job_description ?? null,
            a.location ?? null, a.employment_type ?? null, a.work_arrangement ?? null,
            a.salary_min ?? null, a.salary_max ?? null, a.currency || 'USD',
            a.status, a.source ?? null, a.recruiter_name ?? null, a.recruiter_email ?? null,
            a.recruiter_phone ?? null, a.recruiter_linkedin ?? null, a.resume_id ?? null,
            a.applied_at ?? null, a.created_at, a.updated_at
          ]
        );
      }

      // 4. Interviews
      for (const i of backup.interviews || []) {
        await db.runAsync(
          `INSERT INTO interviews (
            id, application_id, round_name, interview_type, scheduled_at,
            duration_minutes, interviewer_name, interviewer_email, meeting_url,
            location, preparation_notes, feedback, outcome, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            i.id, i.application_id, i.round_name, i.interview_type, i.scheduled_at,
            i.duration_minutes ?? null, i.interviewer_name ?? null, i.interviewer_email ?? null,
            i.meeting_url ?? null, i.location ?? null, i.preparation_notes ?? null,
            i.feedback ?? null, i.outcome, i.created_at, i.updated_at
          ]
        );
      }

      // 5. Notes
      for (const n of backup.notes || []) {
        await db.runAsync(
          `INSERT INTO application_notes (id, application_id, company_id, interview_id, title, content, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [n.id, n.application_id ?? null, n.company_id ?? null, n.interview_id ?? null, n.title, n.content, n.created_at, n.updated_at]
        );
      }

      // 6. Status History
      for (const s of backup.status_history || []) {
        await db.runAsync(
          `INSERT INTO status_history (id, application_id, previous_status, new_status, changed_at, notes)
           VALUES (?, ?, ?, ?, ?, ?);`,
          [s.id, s.application_id, s.previous_status ?? null, s.new_status, s.changed_at, s.notes ?? null]
        );
      }

      // 7. Reminders
      for (const r of backup.reminders || []) {
        await db.runAsync(
          `INSERT INTO reminders (
            id, application_id, title, description, reminder_type, remind_at,
            notification_enabled, notification_id, is_completed, completed_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            r.id, r.application_id ?? null, r.title, r.description ?? null,
            r.reminder_type, r.remind_at, r.notification_enabled ? 1 : 0,
            r.notification_id ?? null, r.is_completed ? 1 : 0, r.completed_at ?? null,
            r.created_at, r.updated_at
          ]
        );
      }

      await db.execAsync('PRAGMA foreign_keys = ON;');
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Restore failed' };
  }
}
