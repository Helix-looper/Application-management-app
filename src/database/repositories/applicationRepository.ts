import { Application, ApplicationStatus, EmploymentType, WorkArrangement } from '@/types';
import { generateId, nowISO } from '@/utils/helpers';
import { getDatabase } from '../database';

export interface ApplicationFilterOptions {
  status?: ApplicationStatus | null;
  search?: string;
  location?: string;
  employment_type?: EmploymentType | null;
  work_arrangement?: WorkArrangement | null;
  sort?: 'newest' | 'oldest' | 'company' | 'title' | 'upcoming_interview';
}

export type ApplicationListItem = Application & {
  company_name: string;
  interview_count: number;
  upcoming_interview_date?: string | null;
};

export async function getAllApplications(
  filters?: ApplicationFilterOptions
): Promise<ApplicationListItem[]> {
  const db = await getDatabase();
  let query = `
    SELECT 
      a.*,
      c.name AS company_name,
      (SELECT COUNT(*) FROM interviews i WHERE i.application_id = a.id) AS interview_count,
      (SELECT MIN(i.scheduled_at) FROM interviews i WHERE i.application_id = a.id AND datetime(i.scheduled_at) >= datetime('now')) AS upcoming_interview_date
    FROM applications a
    JOIN companies c ON a.company_id = c.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (filters?.status) {
    query += ' AND a.status = ?';
    params.push(filters.status);
  }

  if (filters?.search && filters.search.trim().length > 0) {
    const term = `%${filters.search.trim()}%`;
    query += ' AND (a.job_title LIKE ? OR c.name LIKE ? OR a.location LIKE ?)';
    params.push(term, term, term);
  }

  if (filters?.employment_type) {
    query += ' AND a.employment_type = ?';
    params.push(filters.employment_type);
  }

  if (filters?.work_arrangement) {
    query += ' AND a.work_arrangement = ?';
    params.push(filters.work_arrangement);
  }

  if (filters?.location && filters.location.trim().length > 0) {
    query += ' AND a.location LIKE ?';
    params.push(`%${filters.location.trim()}%`);
  }

  switch (filters?.sort) {
    case 'oldest':
      query += ' ORDER BY a.created_at ASC';
      break;
    case 'company':
      query += ' ORDER BY c.name COLLATE NOCASE ASC';
      break;
    case 'title':
      query += ' ORDER BY a.job_title COLLATE NOCASE ASC';
      break;
    case 'upcoming_interview':
      query += ' ORDER BY upcoming_interview_date IS NULL, upcoming_interview_date ASC, a.created_at DESC';
      break;
    case 'newest':
    default:
      query += ' ORDER BY a.created_at DESC';
  }

  return db.getAllAsync<ApplicationListItem>(query, params);
}

export async function getApplicationById(id: string): Promise<ApplicationListItem | null> {
  const db = await getDatabase();
  return db.getFirstAsync<ApplicationListItem>(
    `SELECT 
      a.*,
      c.name AS company_name,
      (SELECT COUNT(*) FROM interviews i WHERE i.application_id = a.id) AS interview_count,
      (SELECT MIN(i.scheduled_at) FROM interviews i WHERE i.application_id = a.id AND datetime(i.scheduled_at) >= datetime('now')) AS upcoming_interview_date
    FROM applications a
    JOIN companies c ON a.company_id = c.id
    WHERE a.id = ?;`,
    [id]
  );
}

export async function getApplicationsByCompanyId(companyId: string): Promise<ApplicationListItem[]> {
  const db = await getDatabase();
  return db.getAllAsync<ApplicationListItem>(
    `SELECT 
      a.*,
      c.name AS company_name,
      (SELECT COUNT(*) FROM interviews i WHERE i.application_id = a.id) AS interview_count
    FROM applications a
    JOIN companies c ON a.company_id = c.id
    WHERE a.company_id = ?
    ORDER BY a.created_at DESC;`,
    [companyId]
  );
}

export async function createApplication(
  data: Omit<Application, 'id' | 'created_at' | 'updated_at'>
): Promise<Application> {
  const db = await getDatabase();
  const now = nowISO();
  const id = generateId();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO applications (
        id, company_id, job_title, job_url, job_description, location,
        employment_type, work_arrangement, salary_min, salary_max, currency,
        status, source, recruiter_name, recruiter_email, recruiter_phone,
        recruiter_linkedin, resume_id, applied_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.company_id,
        data.job_title.trim(),
        data.job_url || null,
        data.job_description || null,
        data.location || null,
        data.employment_type || null,
        data.work_arrangement || null,
        data.salary_min !== undefined ? data.salary_min : null,
        data.salary_max !== undefined ? data.salary_max : null,
        data.currency || 'INR',
        data.status,
        data.source || null,
        data.recruiter_name || null,
        data.recruiter_email || null,
        data.recruiter_phone || null,
        data.recruiter_linkedin || null,
        data.resume_id || null,
        data.applied_at || (data.status === 'applied' ? now : null),
        now,
        now,
      ]
    );

    // Initial status entry in history
    await db.runAsync(
      `INSERT INTO status_history (id, application_id, previous_status, new_status, changed_at, notes)
       VALUES (?, ?, NULL, ?, ?, ?);`,
      [generateId(), id, data.status, now, 'Initial status created']
    );
  });

  return { id, ...data, created_at: now, updated_at: now };
}

export async function updateApplication(
  id: string,
  data: Partial<Omit<Application, 'id' | 'created_at'>>
): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();

  await db.runAsync(
    `UPDATE applications SET
      company_id = COALESCE(?, company_id),
      job_title = COALESCE(?, job_title),
      job_url = ?,
      job_description = ?,
      location = ?,
      employment_type = ?,
      work_arrangement = ?,
      salary_min = ?,
      salary_max = ?,
      currency = COALESCE(?, currency),
      source = ?,
      recruiter_name = ?,
      recruiter_email = ?,
      recruiter_phone = ?,
      recruiter_linkedin = ?,
      resume_id = ?,
      applied_at = ?,
      updated_at = ?
    WHERE id = ?;`,
    [
      data.company_id || null,
      data.job_title ? data.job_title.trim() : null,
      data.job_url !== undefined ? data.job_url : null,
      data.job_description !== undefined ? data.job_description : null,
      data.location !== undefined ? data.location : null,
      data.employment_type !== undefined ? data.employment_type : null,
      data.work_arrangement !== undefined ? data.work_arrangement : null,
      data.salary_min !== undefined ? data.salary_min : null,
      data.salary_max !== undefined ? data.salary_max : null,
      data.currency || null,
      data.source !== undefined ? data.source : null,
      data.recruiter_name !== undefined ? data.recruiter_name : null,
      data.recruiter_email !== undefined ? data.recruiter_email : null,
      data.recruiter_phone !== undefined ? data.recruiter_phone : null,
      data.recruiter_linkedin !== undefined ? data.recruiter_linkedin : null,
      data.resume_id !== undefined ? data.resume_id : null,
      data.applied_at !== undefined ? data.applied_at : null,
      now,
      id,
    ]
  );
}

export async function updateApplicationStatus(
  id: string,
  newStatus: ApplicationStatus,
  previousStatus: ApplicationStatus,
  notes?: string
): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();

  await db.withTransactionAsync(async () => {
    // If moving to applied and applied_at is null, set applied_at
    let appliedAtUpdate = '';
    const params: any[] = [newStatus, now];
    if (newStatus === 'applied') {
      appliedAtUpdate = ', applied_at = COALESCE(applied_at, ?)';
      params.push(now);
    }
    params.push(id);

    await db.runAsync(
      `UPDATE applications SET status = ?, updated_at = ?${appliedAtUpdate} WHERE id = ?;`,
      params
    );

    await db.runAsync(
      `INSERT INTO status_history (id, application_id, previous_status, new_status, changed_at, notes)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [generateId(), id, previousStatus, newStatus, now, notes || null]
    );
  });
}

export async function deleteApplication(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM applications WHERE id = ?;', [id]);
}

export async function getStatusHistory(applicationId: string) {
  const db = await getDatabase();
  return db.getAllAsync<{
    id: string;
    application_id: string;
    previous_status: ApplicationStatus | null;
    new_status: ApplicationStatus;
    changed_at: string;
    notes: string | null;
  }>(
    'SELECT * FROM status_history WHERE application_id = ? ORDER BY changed_at DESC;',
    [applicationId]
  );
}

export async function getApplicationStats(): Promise<{
  total: number;
  saved: number;
  applied: number;
  assessment: number;
  interview: number;
  offer: number;
  rejected: number;
  withdrawn: number;
}> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ status: string; count: number }>(
    'SELECT status, COUNT(*) as count FROM applications GROUP BY status;'
  );
  const stats = {
    total: 0,
    saved: 0,
    applied: 0,
    assessment: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    withdrawn: 0,
  };
  for (const row of rows) {
    stats.total += row.count;
    if (row.status in stats) {
      (stats as any)[row.status] = row.count;
    }
  }
  return stats;
}
