import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const db = await SQLite.openDatabaseAsync('jobpilot.db');
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await runMigrations(db);
    dbInstance = db;
    return db;
  })();

  return initPromise;
}

export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    PRAGMA foreign_keys = OFF;
    DELETE FROM application_notes;
    DELETE FROM interviews;
    DELETE FROM reminders;
    DELETE FROM status_history;
    DELETE FROM applications;
    DELETE FROM companies;
    DELETE FROM resumes;
    PRAGMA foreign_keys = ON;
  `);
}
