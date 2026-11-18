import { getDatabase } from '@/database/database';
import { Application, Company } from '@/types';

export interface SyncResult {
  success: boolean;
  message: string;
  importedCount?: number;
  error?: string;
}

function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `http://${url}`;
  }
  return url.replace(/\/+$/, '');
}

export async function pairWithDesktop(
  desktopUrl: string,
  pin: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  const cleanUrl = normalizeUrl(desktopUrl);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${cleanUrl}/api/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      return { success: true, token: data.token };
    } else {
      return { success: false, error: data.error || `Authentication failed (HTTP ${res.status})` };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        success: false,
        error: `Connection timed out reaching ${cleanUrl}. Check if your desktop companion is running.`,
      };
    }
    return {
      success: false,
      error: `Could not reach ${cleanUrl}: ${err.message || 'Network request failed'}. Ensure both devices are on the same Wi-Fi.`,
    };
  }
}

export async function syncWithDesktop(
  desktopUrl: string,
  token: string
): Promise<SyncResult> {
  const cleanUrl = normalizeUrl(desktopUrl);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    // 1. Read current mobile data from SQLite
    const db = await getDatabase();
    const [companies, applications] = await Promise.all([
      db.getAllAsync<Company>('SELECT * FROM companies;'),
      db.getAllAsync<Application>('SELECT * FROM applications;'),
    ]);

    // 2. Transmit to Desktop Sync Bridge
    const res = await fetch(`${cleanUrl}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        device: 'Android Phone',
        applications,
        companies,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { success: false, message: errJson.error || `Sync rejected with HTTP ${res.status}` };
    }

    const result = await res.json();
    if (!result.ok || !result.data) {
      return { success: false, message: 'Invalid sync response from desktop' };
    }

    // 3. Upsert received desktop applications & companies into Android SQLite
    const desktopApps: Application[] = result.data.applications || [];
    const desktopCompanies: Company[] = result.data.companies || [];

    let importedCount = 0;

    await db.withTransactionAsync(async () => {
      // Upsert Companies
      for (const c of desktopCompanies) {
        await db.runAsync(
          `INSERT OR REPLACE INTO companies (
            id, name, website, industry, location, description, company_size,
            linkedin_url, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            c.id, c.name, c.website ?? null, c.industry ?? null, c.location ?? null,
            c.description ?? null, c.company_size ?? null, c.linkedin_url ?? null,
            c.notes ?? null, c.created_at, c.updated_at
          ]
        );
      }

      // Upsert Applications
      for (const a of desktopApps) {
        await db.runAsync(
          `INSERT OR REPLACE INTO applications (
            id, company_id, job_title, job_url, job_description, location,
            employment_type, work_arrangement, salary_min, salary_max, currency,
            status, source, recruiter_name, recruiter_email, recruiter_phone,
            recruiter_linkedin, resume_id, applied_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            a.id, a.company_id, a.job_title, a.job_url ?? null, a.job_description ?? null,
            a.location ?? null, a.employment_type ?? null, a.work_arrangement ?? null,
            a.salary_min ?? null, a.salary_max ?? null, a.currency || 'INR',
            a.status, a.source ?? null, a.recruiter_name ?? null, a.recruiter_email ?? null,
            a.recruiter_phone ?? null, a.recruiter_linkedin ?? null, a.resume_id ?? null,
            a.applied_at ?? null, a.created_at, a.updated_at
          ]
        );
        importedCount++;
      }
    });

    return {
      success: true,
      message: `Successfully synchronized ${desktopApps.length} opportunities with Desktop!`,
      importedCount,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        success: false,
        message: 'Sync request timed out. Please try again.',
      };
    }
    return {
      success: false,
      message: 'Network error during sync: ' + (err.message || 'Check your Wi-Fi connection.'),
    };
  }
}
