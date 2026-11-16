import * as FileSystem from 'expo-file-system/legacy';
import { Resume } from '@/types';
import { generateId, nowISO } from '@/utils/helpers';
import { getDatabase } from '../database';

const RESUMES_DIR = `${FileSystem.documentDirectory}resumes/`;

async function ensureResumesDirectory(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(RESUMES_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(RESUMES_DIR, { intermediates: true });
  }
}

export async function getAllResumes(): Promise<Resume[]> {
  const db = await getDatabase();
  return db.getAllAsync<Resume>('SELECT * FROM resumes ORDER BY created_at DESC;');
}

export async function getResumeById(id: string): Promise<Resume | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Resume>('SELECT * FROM resumes WHERE id = ?;', [id]);
}

export async function importResumeFile(
  sourceUri: string,
  originalFileName: string,
  customName?: string,
  mimeType = 'application/pdf',
  fileSize = 0
): Promise<Resume> {
  await ensureResumesDirectory();

  const id = generateId();
  const safeExt = originalFileName.includes('.')
    ? originalFileName.slice(originalFileName.lastIndexOf('.'))
    : '.pdf';
  const targetFileName = `${id}${safeExt}`;
  const targetPath = `${RESUMES_DIR}${targetFileName}`;

  // Copy file safely from temporary/picker URI to permanent app storage
  await FileSystem.copyAsync({
    from: sourceUri,
    to: targetPath,
  });

  // Check actual file size if not provided
  let actualSize = fileSize;
  if (!actualSize) {
    const fileInfo = await FileSystem.getInfoAsync(targetPath);
    if (fileInfo.exists && 'size' in fileInfo) {
      actualSize = fileInfo.size;
    }
  }

  const now = nowISO();
  const displayName = customName?.trim() || originalFileName.replace(/\.[^/.]+$/, '');

  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO resumes (id, name, file_name, local_file_path, mime_type, file_size, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [id, displayName, originalFileName, targetPath, mimeType, actualSize, now, now]
  );

  return {
    id,
    name: displayName,
    file_name: originalFileName,
    local_file_path: targetPath,
    mime_type: mimeType,
    file_size: actualSize,
    created_at: now,
    updated_at: now,
  };
}

export async function renameResume(id: string, newName: string): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();
  await db.runAsync(
    'UPDATE resumes SET name = ?, updated_at = ? WHERE id = ?;',
    [newName.trim(), now, id]
  );
}

export async function deleteResume(id: string): Promise<void> {
  const db = await getDatabase();
  const resume = await getResumeById(id);
  if (resume && resume.local_file_path) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(resume.local_file_path);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(resume.local_file_path, { idempotent: true });
      }
    } catch (e) {
      console.warn('Could not delete resume file on disk:', e);
    }
  }

  // Set resume_id to NULL in any applications referencing it
  await db.runAsync('UPDATE applications SET resume_id = NULL WHERE resume_id = ?;', [id]);
  await db.runAsync('DELETE FROM resumes WHERE id = ?;', [id]);
}
