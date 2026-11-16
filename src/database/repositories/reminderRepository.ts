import { Reminder, ReminderType } from '@/types';
import { generateId, nowISO } from '@/utils/helpers';
import { getDatabase } from '../database';
import dayjs from 'dayjs';

export async function getAllReminders(): Promise<Reminder[]> {
  const db = await getDatabase();
  return db.getAllAsync<Reminder>(
    `SELECT 
      r.*,
      a.job_title,
      c.name AS company_name
    FROM reminders r
    LEFT JOIN applications a ON r.application_id = a.id
    LEFT JOIN companies c ON a.company_id = c.id
    ORDER BY r.is_completed ASC, r.remind_at ASC;`
  );
}

export async function getPendingReminders(limit?: number): Promise<Reminder[]> {
  const db = await getDatabase();
  const limitClause = limit ? `LIMIT ${limit}` : '';
  return db.getAllAsync<Reminder>(
    `SELECT 
      r.*,
      a.job_title,
      c.name AS company_name
    FROM reminders r
    LEFT JOIN applications a ON r.application_id = a.id
    LEFT JOIN companies c ON a.company_id = c.id
    WHERE r.is_completed = 0
    ORDER BY r.remind_at ASC
    ${limitClause};`
  );
}

export async function getRemindersByApplicationId(applicationId: string): Promise<Reminder[]> {
  const db = await getDatabase();
  return db.getAllAsync<Reminder>(
    'SELECT * FROM reminders WHERE application_id = ? ORDER BY is_completed ASC, remind_at ASC;',
    [applicationId]
  );
}

export async function createReminder(
  data: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>
): Promise<Reminder> {
  const db = await getDatabase();
  const now = nowISO();
  const id = generateId();

  await db.runAsync(
    `INSERT INTO reminders (
      id, application_id, title, description, reminder_type,
      remind_at, notification_enabled, notification_id, is_completed,
      completed_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      data.application_id || null,
      data.title.trim(),
      data.description || null,
      data.reminder_type || 'custom',
      data.remind_at,
      data.notification_enabled ? 1 : 0,
      data.notification_id || null,
      data.is_completed ? 1 : 0,
      data.completed_at || null,
      now,
      now,
    ]
  );

  return { id, ...data, created_at: now, updated_at: now };
}

export async function toggleReminderComplete(
  id: string,
  isCompleted: boolean
): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();
  await db.runAsync(
    'UPDATE reminders SET is_completed = ?, completed_at = ?, updated_at = ? WHERE id = ?;',
    [isCompleted ? 1 : 0, isCompleted ? now : null, now, id]
  );
}

export async function snoozeReminder(id: string, hours = 24): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();
  const newDate = dayjs().add(hours, 'hour').toISOString();
  await db.runAsync(
    'UPDATE reminders SET remind_at = ?, is_completed = 0, completed_at = NULL, updated_at = ? WHERE id = ?;',
    [newDate, now, id]
  );
}

export async function deleteReminder(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM reminders WHERE id = ?;', [id]);
}
