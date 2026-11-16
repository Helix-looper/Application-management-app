import { Company } from '@/types';
import { generateId, nowISO } from '@/utils/helpers';
import { getDatabase } from '../database';

export async function getAllCompanies(): Promise<Company[]> {
  const db = await getDatabase();
  return db.getAllAsync<Company>('SELECT * FROM companies ORDER BY name COLLATE NOCASE ASC;');
}

export async function searchCompanies(query: string): Promise<Company[]> {
  const db = await getDatabase();
  return db.getAllAsync<Company>(
    'SELECT * FROM companies WHERE name LIKE ? ORDER BY name COLLATE NOCASE ASC LIMIT 20;',
    [`%${query}%`]
  );
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Company>('SELECT * FROM companies WHERE id = ?;', [id]);
}

export async function getCompanyByName(name: string): Promise<Company | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Company>(
    'SELECT * FROM companies WHERE LOWER(TRIM(name)) = LOWER(TRIM(?));',
    [name]
  );
}

export async function createCompany(
  data: Omit<Company, 'id' | 'created_at' | 'updated_at'>
): Promise<Company> {
  const db = await getDatabase();
  const now = nowISO();
  const id = generateId();
  await db.runAsync(
    `INSERT INTO companies (
      id, name, website, industry, location, description,
      company_size, linkedin_url, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      data.name.trim(),
      data.website || null,
      data.industry || null,
      data.location || null,
      data.description || null,
      data.company_size || null,
      data.linkedin_url || null,
      data.notes || null,
      now,
      now,
    ]
  );
  return { id, ...data, name: data.name.trim(), created_at: now, updated_at: now };
}

export async function getOrCreateCompany(name: string): Promise<Company> {
  const cleanName = name.trim();
  const existing = await getCompanyByName(cleanName);
  if (existing) {
    return existing;
  }
  return createCompany({ name: cleanName });
}

export async function updateCompany(
  id: string,
  data: Partial<Omit<Company, 'id' | 'created_at'>>
): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();
  await db.runAsync(
    `UPDATE companies SET
      name = COALESCE(?, name),
      website = ?,
      industry = ?,
      location = ?,
      description = ?,
      company_size = ?,
      linkedin_url = ?,
      notes = ?,
      updated_at = ?
    WHERE id = ?;`,
    [
      data.name ? data.name.trim() : null,
      data.website !== undefined ? data.website : null,
      data.industry !== undefined ? data.industry : null,
      data.location !== undefined ? data.location : null,
      data.description !== undefined ? data.description : null,
      data.company_size !== undefined ? data.company_size : null,
      data.linkedin_url !== undefined ? data.linkedin_url : null,
      data.notes !== undefined ? data.notes : null,
      now,
      id,
    ]
  );
}

export async function deleteCompany(id: string): Promise<{ success: boolean; reason?: string }> {
  const db = await getDatabase();
  const linked = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM applications WHERE company_id = ?;',
    [id]
  );
  if (linked && linked.count > 0) {
    return {
      success: false,
      reason: `Cannot delete company with ${linked.count} linked application(s). Delete or move the applications first.`,
    };
  }
  await db.runAsync('DELETE FROM companies WHERE id = ?;', [id]);
  return { success: true };
}
