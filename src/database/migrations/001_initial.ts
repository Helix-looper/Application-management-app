import * as SQLite from 'expo-sqlite';

export async function migration_001(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      website TEXT,
      industry TEXT,
      location TEXT,
      description TEXT,
      company_size TEXT,
      linkedin_url TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

    CREATE TABLE IF NOT EXISTS resumes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      file_name TEXT NOT NULL,
      local_file_path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      job_title TEXT NOT NULL,
      job_url TEXT,
      job_description TEXT,
      location TEXT,
      employment_type TEXT,
      work_arrangement TEXT,
      salary_min REAL,
      salary_max REAL,
      currency TEXT DEFAULT 'INR',
      status TEXT NOT NULL DEFAULT 'saved',
      source TEXT,
      recruiter_name TEXT,
      recruiter_email TEXT,
      recruiter_phone TEXT,
      recruiter_linkedin TEXT,
      resume_id TEXT,
      applied_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
      FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
    CREATE INDEX IF NOT EXISTS idx_applications_company ON applications(company_id);
    CREATE INDEX IF NOT EXISTS idx_applications_created ON applications(created_at);

    CREATE TABLE IF NOT EXISTS interviews (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      round_name TEXT NOT NULL,
      interview_type TEXT NOT NULL DEFAULT 'other',
      scheduled_at TEXT NOT NULL,
      duration_minutes INTEGER,
      interviewer_name TEXT,
      interviewer_email TEXT,
      meeting_url TEXT,
      location TEXT,
      preparation_notes TEXT,
      feedback TEXT,
      outcome TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_interviews_application ON interviews(application_id);
    CREATE INDEX IF NOT EXISTS idx_interviews_scheduled ON interviews(scheduled_at);

    CREATE TABLE IF NOT EXISTS application_notes (
      id TEXT PRIMARY KEY,
      application_id TEXT,
      company_id TEXT,
      interview_id TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_notes_application ON application_notes(application_id);
    CREATE INDEX IF NOT EXISTS idx_notes_company ON application_notes(company_id);

    CREATE TABLE IF NOT EXISTS status_history (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      previous_status TEXT,
      new_status TEXT NOT NULL,
      changed_at TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_status_history_application ON status_history(application_id);

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      application_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      reminder_type TEXT NOT NULL DEFAULT 'custom',
      remind_at TEXT NOT NULL,
      notification_enabled INTEGER NOT NULL DEFAULT 1,
      notification_id TEXT,
      is_completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at);
    CREATE INDEX IF NOT EXISTS idx_reminders_completed ON reminders(is_completed);

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    INSERT OR IGNORE INTO app_settings (key, value) VALUES
      ('theme', 'system'),
      ('default_view', 'list'),
      ('default_sort', 'newest'),
      ('date_format', 'MMM D, YYYY'),
      ('currency', 'INR'),
      ('first_day_of_week', '0'),
      ('notifications_enabled', '1');
  `);
}
