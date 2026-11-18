/**
 * JobPilot Web — Browser-side IndexedDB store
 * Mirrors the Android SQLite schema so BackupData is 100% compatible.
 * This is the single source of truth for the web app.
 */
import { BackupData, Company, Application, ApplicationNote, Interview,
         Reminder, Resume, StatusHistory, ApplicationListItem } from '@/types';
import { generateId, nowISO } from '@/lib/helpers';

const DB_NAME = 'jobpilot_web';
const DB_VERSION = 1;

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('companies')) {
        const co = db.createObjectStore('companies', { keyPath: 'id' });
        co.createIndex('name', 'name');
      }
      if (!db.objectStoreNames.contains('applications')) {
        const ao = db.createObjectStore('applications', { keyPath: 'id' });
        ao.createIndex('status', 'status');
        ao.createIndex('company_id', 'company_id');
        ao.createIndex('created_at', 'created_at');
      }
      if (!db.objectStoreNames.contains('interviews'))
        db.createObjectStore('interviews', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('application_notes'))
        db.createObjectStore('application_notes', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('status_history'))
        db.createObjectStore('status_history', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('reminders'))
        db.createObjectStore('reminders', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('resumes'))
        db.createObjectStore('resumes', { keyPath: 'id' });
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

function txGet<T>(store: string): Promise<T[]> {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

function txPut(store: string, item: object): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function txDelete(store: string, id: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function txClear(store: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ─── Companies ───────────────────────────────────────────────────────────────

export async function getAllCompanies(): Promise<Company[]> {
  return txGet<Company>('companies');
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('companies', 'readonly');
    const req = tx.objectStore('companies').get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function upsertCompany(data: Omit<Company, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<Company> {
  const now = nowISO();
  const company: Company = {
    id: data.id ?? generateId(),
    created_at: now,
    ...data,
    updated_at: now,
  };
  await txPut('companies', company);
  return company;
}

export async function deleteCompany(id: string): Promise<void> {
  return txDelete('companies', id);
}

// ─── Applications ─────────────────────────────────────────────────────────────

export async function getAllApplications(): Promise<ApplicationListItem[]> {
  const [apps, companies, interviews] = await Promise.all([
    txGet<Application>('applications'),
    txGet<Company>('companies'),
    txGet<Interview>('interviews'),
  ]);

  const companyMap = new Map(companies.map(c => [c.id, c]));
  const now = new Date();

  return apps.map(app => {
    const appInterviews = interviews.filter(i => i.application_id === app.id);
    const upcoming = appInterviews
      .filter(i => new Date(i.scheduled_at) >= now)
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0];

    return {
      ...app,
      company_name: companyMap.get(app.company_id)?.name ?? '',
      interview_count: appInterviews.length,
      upcoming_interview_date: upcoming?.scheduled_at ?? null,
    };
  }).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getApplicationById(id: string): Promise<ApplicationListItem | null> {
  const all = await getAllApplications();
  return all.find(a => a.id === id) ?? null;
}

export async function createApplication(
  data: Omit<Application, 'id' | 'created_at' | 'updated_at'>
): Promise<Application> {
  const now = nowISO();
  const id = generateId();
  const app: Application = {
    id,
    ...data,
    applied_at: data.applied_at ?? (data.status === 'applied' ? now : null),
    created_at: now,
    updated_at: now,
  };
  await txPut('applications', app);
  await txPut('status_history', {
    id: generateId(),
    application_id: id,
    previous_status: null,
    new_status: data.status,
    changed_at: now,
    notes: 'Created via web',
  });
  return app;
}

export async function updateApplication(
  id: string,
  data: Partial<Omit<Application, 'id' | 'created_at'>>
): Promise<void> {
  const db = await openDB();
  const existing: Application = await new Promise((resolve, reject) => {
    const req = db.transaction('applications', 'readonly').objectStore('applications').get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  if (!existing) return;
  const updated = { ...existing, ...data, updated_at: nowISO() };
  await txPut('applications', updated);
}

export async function updateApplicationStatus(
  id: string, newStatus: string, previousStatus: string, notes?: string
): Promise<void> {
  await updateApplication(id, { status: newStatus as Application['status'] });
  await txPut('status_history', {
    id: generateId(),
    application_id: id,
    previous_status: previousStatus,
    new_status: newStatus,
    changed_at: nowISO(),
    notes: notes ?? null,
  });
}

export async function deleteApplication(id: string): Promise<void> {
  await txDelete('applications', id);
}

export async function bulkDeleteApplications(ids: string[]): Promise<void> {
  await Promise.all(ids.map(id => txDelete('applications', id)));
}

export async function bulkUpdateStatus(ids: string[], newStatus: string): Promise<void> {
  const apps = await getAllApplications();
  const appMap = new Map(apps.map(a => [a.id, a]));
  await Promise.all(
    ids.map(id => {
      const app = appMap.get(id);
      if (!app) return Promise.resolve();
      return updateApplicationStatus(id, newStatus, app.status);
    })
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getApplicationStats() {
  const apps = await txGet<Application>('applications');
  const stats = { total: 0, saved: 0, applied: 0, assessment: 0, interview: 0, offer: 0, rejected: 0, withdrawn: 0 };
  for (const a of apps) {
    stats.total++;
    if (a.status in stats) (stats as Record<string, number>)[a.status]++;
  }
  return stats;
}

// ─── Backup / Restore ─────────────────────────────────────────────────────────

export async function exportBackupData(): Promise<BackupData> {
  const [companies, applications, interviews, notes, status_history, reminders, resumes] =
    await Promise.all([
      txGet<Company>('companies'),
      txGet<Application>('applications'),
      txGet<Interview>('interviews'),
      txGet<ApplicationNote>('application_notes'),
      txGet<StatusHistory>('status_history'),
      txGet<Reminder>('reminders'),
      txGet<Resume>('resumes'),
    ]);

  return {
    version: 1,
    exported_at: nowISO(),
    companies,
    applications,
    interviews,
    notes,
    status_history,
    reminders,
    resumes,
    settings: {},
  };
}

export async function importBackupData(backup: BackupData): Promise<{ imported: number; skipped: number }> {
  const stores = ['application_notes', 'status_history', 'reminders', 'interviews', 'applications', 'companies', 'resumes'];
  const existing = await exportBackupData();
  const existingIds = new Set([
    ...existing.companies.map(c => c.id),
    ...existing.applications.map(a => a.id),
  ]);

  let imported = 0, skipped = 0;

  for (const c of backup.companies) {
    if (existingIds.has(c.id)) { skipped++; continue; }
    await txPut('companies', c);
    imported++;
  }
  for (const a of backup.applications) {
    if (existingIds.has(a.id)) { skipped++; continue; }
    await txPut('applications', a);
    imported++;
  }
  for (const i of backup.interviews ?? []) { await txPut('interviews', i); }
  for (const n of backup.notes ?? []) { await txPut('application_notes', n); }
  for (const s of backup.status_history ?? []) { await txPut('status_history', s); }
  for (const r of backup.reminders ?? []) { await txPut('reminders', r); }

  return { imported, skipped };
}

export async function restoreBackupData(backup: BackupData): Promise<void> {
  const stores = ['application_notes', 'status_history', 'reminders', 'interviews', 'applications', 'companies', 'resumes'];
  await Promise.all(stores.map(s => txClear(s)));

  for (const c of backup.companies) await txPut('companies', c);
  for (const r of backup.resumes ?? []) await txPut('resumes', r);
  for (const a of backup.applications) await txPut('applications', a);
  for (const i of backup.interviews ?? []) await txPut('interviews', i);
  for (const n of backup.notes ?? []) await txPut('application_notes', n);
  for (const s of backup.status_history ?? []) await txPut('status_history', s);
  for (const r of backup.reminders ?? []) await txPut('reminders', r);
}

export function downloadBackup(data: BackupData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jobpilot_backup_${new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function validateBackup(content: string): { valid: boolean; data?: BackupData; error?: string } {
  try {
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== 'object') return { valid: false, error: 'Not a valid JSON object' };
    if (!parsed.version || typeof parsed.version !== 'number') return { valid: false, error: 'Missing version field' };
    if (!Array.isArray(parsed.companies) || !Array.isArray(parsed.applications))
      return { valid: false, error: 'Missing companies or applications arrays' };
    return { valid: true, data: parsed as BackupData };
  } catch (e: unknown) {
    return { valid: false, error: `JSON parse error: ${e instanceof Error ? e.message : 'unknown'}` };
  }
}

export async function clearAllData(): Promise<void> {
  const stores = ['application_notes', 'status_history', 'reminders', 'interviews', 'applications', 'companies', 'resumes'];
  await Promise.all(stores.map(s => txClear(s)));
}

export const db = {
  getCompanies: getAllCompanies,
  getApplications: getAllApplications,
  getStats: getApplicationStats,
  clearAllData,
  exportBackup: exportBackupData,
  importBackup: importBackupData,
  restoreBackup: restoreBackupData,
};

