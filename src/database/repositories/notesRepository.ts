import { ApplicationNote } from '@/types';
import { generateId, nowISO } from '@/utils/helpers';
import { getDatabase } from '../database';

export async function getNotesByApplicationId(applicationId: string): Promise<ApplicationNote[]> {
  const db = await getDatabase();
  return db.getAllAsync<ApplicationNote>(
    'SELECT * FROM application_notes WHERE application_id = ? ORDER BY created_at DESC;',
    [applicationId]
  );
}

export async function getNotesByCompanyId(companyId: string): Promise<ApplicationNote[]> {
  const db = await getDatabase();
  return db.getAllAsync<ApplicationNote>(
    'SELECT * FROM application_notes WHERE company_id = ? ORDER BY created_at DESC;',
    [companyId]
  );
}

export async function createNote(
  data: Omit<ApplicationNote, 'id' | 'created_at' | 'updated_at'>
): Promise<ApplicationNote> {
  const db = await getDatabase();
  const now = nowISO();
  const id = generateId();

  await db.runAsync(
    `INSERT INTO application_notes (
      id, application_id, company_id, interview_id, title, content, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      data.application_id || null,
      data.company_id || null,
      data.interview_id || null,
      data.title.trim(),
      data.content.trim(),
      now,
      now,
    ]
  );

  return { id, ...data, created_at: now, updated_at: now };
}

export async function updateNote(
  id: string,
  data: { title?: string; content?: string }
): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();
  await db.runAsync(
    `UPDATE application_notes SET
      title = COALESCE(?, title),
      content = COALESCE(?, content),
      updated_at = ?
    WHERE id = ?;`,
    [data.title ? data.title.trim() : null, data.content ? data.content.trim() : null, now, id]
  );
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM application_notes WHERE id = ?;', [id]);
}
