import { Interview } from '@/types';
import { generateId, nowISO } from '@/utils/helpers';
import { getDatabase } from '../database';

export type InterviewWithDetails = Interview & {
  job_title: string;
  company_name: string;
};

export async function getAllInterviews(): Promise<InterviewWithDetails[]> {
  const db = await getDatabase();
  return db.getAllAsync<InterviewWithDetails>(
    `SELECT 
      i.*,
      a.job_title,
      c.name AS company_name
    FROM interviews i
    JOIN applications a ON i.application_id = a.id
    JOIN companies c ON a.company_id = c.id
    ORDER BY i.scheduled_at ASC;`
  );
}

export async function getUpcomingInterviews(limit = 5): Promise<InterviewWithDetails[]> {
  const db = await getDatabase();
  return db.getAllAsync<InterviewWithDetails>(
    `SELECT 
      i.*,
      a.job_title,
      c.name AS company_name
    FROM interviews i
    JOIN applications a ON i.application_id = a.id
    JOIN companies c ON a.company_id = c.id
    WHERE datetime(i.scheduled_at) >= datetime('now')
    ORDER BY i.scheduled_at ASC
    LIMIT ?;`,
    [limit]
  );
}

export async function getInterviewsByApplicationId(applicationId: string): Promise<Interview[]> {
  const db = await getDatabase();
  return db.getAllAsync<Interview>(
    'SELECT * FROM interviews WHERE application_id = ? ORDER BY scheduled_at ASC;',
    [applicationId]
  );
}

export async function getInterviewById(id: string): Promise<InterviewWithDetails | null> {
  const db = await getDatabase();
  return db.getFirstAsync<InterviewWithDetails>(
    `SELECT 
      i.*,
      a.job_title,
      c.name AS company_name
    FROM interviews i
    JOIN applications a ON i.application_id = a.id
    JOIN companies c ON a.company_id = c.id
    WHERE i.id = ?;`,
    [id]
  );
}

export async function createInterview(
  data: Omit<Interview, 'id' | 'created_at' | 'updated_at'>
): Promise<Interview> {
  const db = await getDatabase();
  const now = nowISO();
  const id = generateId();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO interviews (
        id, application_id, round_name, interview_type, scheduled_at,
        duration_minutes, interviewer_name, interviewer_email, meeting_url,
        location, preparation_notes, feedback, outcome, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.application_id,
        data.round_name.trim(),
        data.interview_type,
        data.scheduled_at,
        data.duration_minutes || 45,
        data.interviewer_name || null,
        data.interviewer_email || null,
        data.meeting_url || null,
        data.location || null,
        data.preparation_notes || null,
        data.feedback || null,
        data.outcome || 'pending',
        now,
        now,
      ]
    );

    // If application status is 'saved' or 'applied', update it to 'interview'
    const app = await db.getFirstAsync<{ status: string }>(
      'SELECT status FROM applications WHERE id = ?;',
      [data.application_id]
    );
    if (app && (app.status === 'saved' || app.status === 'applied')) {
      await db.runAsync(
        'UPDATE applications SET status = ?, updated_at = ? WHERE id = ?;',
        ['interview', now, data.application_id]
      );
      await db.runAsync(
        `INSERT INTO status_history (id, application_id, previous_status, new_status, changed_at, notes)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [generateId(), data.application_id, app.status, 'interview', now, `Interview round added: ${data.round_name}`]
      );
    }
  });

  return { id, ...data, created_at: now, updated_at: now };
}

export async function updateInterview(
  id: string,
  data: Partial<Omit<Interview, 'id' | 'created_at'>>
): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();

  await db.runAsync(
    `UPDATE interviews SET
      round_name = COALESCE(?, round_name),
      interview_type = COALESCE(?, interview_type),
      scheduled_at = COALESCE(?, scheduled_at),
      duration_minutes = ?,
      interviewer_name = ?,
      interviewer_email = ?,
      meeting_url = ?,
      location = ?,
      preparation_notes = ?,
      feedback = ?,
      outcome = COALESCE(?, outcome),
      updated_at = ?
    WHERE id = ?;`,
    [
      data.round_name ? data.round_name.trim() : null,
      data.interview_type || null,
      data.scheduled_at || null,
      data.duration_minutes !== undefined ? data.duration_minutes : null,
      data.interviewer_name !== undefined ? data.interviewer_name : null,
      data.interviewer_email !== undefined ? data.interviewer_email : null,
      data.meeting_url !== undefined ? data.meeting_url : null,
      data.location !== undefined ? data.location : null,
      data.preparation_notes !== undefined ? data.preparation_notes : null,
      data.feedback !== undefined ? data.feedback : null,
      data.outcome || null,
      now,
      id,
    ]
  );
}

export async function deleteInterview(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM interviews WHERE id = ?;', [id]);
}
