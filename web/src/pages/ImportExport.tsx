import React, { useState } from 'react';
import { FileDown, Upload, Download, AlertCircle, CheckCircle, FileText, X } from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { exportBackupData, importBackupData, restoreBackupData, downloadBackup, validateBackup } from '@/lib/db';
import { BackupData, Application, ApplicationStatus, EmploymentType } from '@/types';
import { ALL_STATUSES } from '@/lib/statusHelpers';
import { generateId, nowISO } from '@/lib/helpers';

type ImportMode = 'idle' | 'csv' | 'json';
type ImportState = { mode: ImportMode; preview: Application[]; errors: string[]; skipped: number; done: boolean; imported: number };

const CSV_COLUMNS = ['Company', 'Job Title', 'Location', 'Job URL', 'Status', 'Salary Min', 'Salary Max', 'Currency', 'Applied Date', 'Source', 'Description'];

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const parse = (line: string) => {
    const result: string[] = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    result.push(cur.trim());
    return result;
  };
  return { headers: parse(lines[0]), rows: lines.slice(1).map(parse) };
}

export default function ImportExport() {
  const [state, setState] = useState<ImportState>({ mode: 'idle', preview: [], errors: [], skipped: 0, done: false, imported: 0 });
  const [exporting, setExporting] = useState(false);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [csvData, setCsvData] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<BackupData | null>(null);

  const handleExport = async () => {
    setExporting(true);
    const data = await exportBackupData();
    downloadBackup(data);
    setExporting(false);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setCsvData(parsed);
      // Auto-map headers
      const map: Record<string, string> = {};
      for (const h of parsed.headers) {
        const lower = h.toLowerCase().replace(/[\s_-]+/g, '');
        if (lower.includes('company')) map[h] = 'Company';
        else if (lower.includes('title') || lower.includes('position') || lower.includes('role')) map[h] = 'Job Title';
        else if (lower.includes('location') || lower.includes('city')) map[h] = 'Location';
        else if (lower.includes('url') || lower.includes('link')) map[h] = 'Job URL';
        else if (lower.includes('status')) map[h] = 'Status';
        else if (lower.includes('min') || lower.includes('salarymin')) map[h] = 'Salary Min';
        else if (lower.includes('max') || lower.includes('salarymax')) map[h] = 'Salary Max';
        else if (lower.includes('currency')) map[h] = 'Currency';
        else if (lower.includes('applied') || lower.includes('date')) map[h] = 'Applied Date';
        else if (lower.includes('source')) map[h] = 'Source';
        else if (lower.includes('desc') || lower.includes('description')) map[h] = 'Description';
      }
      setColumnMap(map);
      setState(s => ({ ...s, mode: 'csv' }));
    };
    reader.readAsText(file);
  };

  const handleCSVPreview = () => {
    if (!csvData) return;
    const errors: string[] = [];
    const preview: Application[] = [];
    const now = nowISO();

    for (let i = 0; i < csvData.rows.length; i++) {
      const row = csvData.rows[i];
      if (row.length === 0 || row.every(c => !c)) continue;

      const get = (col: string) => {
        const header = Object.entries(columnMap).find(([, v]) => v === col)?.[0];
        if (!header) return '';
        const idx = csvData.headers.indexOf(header);
        return idx >= 0 ? (row[idx] ?? '').trim() : '';
      };

      const company = get('Company');
      const jobTitle = get('Job Title');
      if (!company || !jobTitle) { errors.push(`Row ${i + 2}: Missing company or job title`); continue; }

      const rawStatus = get('Status').toLowerCase();
      const status: ApplicationStatus = ALL_STATUSES.includes(rawStatus as ApplicationStatus) ? rawStatus as ApplicationStatus : 'saved';
      const salMin = parseFloat(get('Salary Min'));
      const salMax = parseFloat(get('Salary Max'));

      preview.push({
        id: generateId(),
        company_id: generateId(),
        company_name: company,
        job_title: jobTitle,
        location: get('Location') || null,
        job_url: get('Job URL') || null,
        job_description: get('Description') || null,
        employment_type: null,
        work_arrangement: null,
        salary_min: isNaN(salMin) ? null : salMin,
        salary_max: isNaN(salMax) ? null : salMax,
        currency: get('Currency') || 'USD',
        status,
        source: get('Source') || null,
        applied_at: get('Applied Date') || null,
        recruiter_name: null, recruiter_email: null, recruiter_phone: null, recruiter_linkedin: null, resume_id: null,
        created_at: now, updated_at: now,
      });
    }

    setState(s => ({ ...s, preview, errors }));
  };

  const handleCSVImport = async () => {
    if (state.preview.length === 0) return;
    const backup: BackupData = {
      version: 1,
      exported_at: nowISO(),
      companies: state.preview.map(a => ({
        id: a.company_id,
        name: a.company_name ?? '',
        created_at: a.created_at,
        updated_at: a.updated_at,
      })),
      applications: state.preview,
      interviews: [], notes: [], status_history: [], reminders: [], resumes: [], settings: {},
    };
    const { imported, skipped } = await importBackupData(backup);
    setState(s => ({ ...s, done: true, imported, skipped }));
  };

  const handleJSONUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const result = validateBackup(text);
      if (!result.valid || !result.data) {
        setState(s => ({ ...s, errors: [result.error ?? 'Invalid file'] }));
        return;
      }
      setPendingRestore(result.data);
    };
    reader.readAsText(file);
  };

  const handleRestoreConfirm = async () => {
    if (!pendingRestore) return;
    await restoreBackupData(pendingRestore);
    setRestoreConfirm(false);
    setPendingRestore(null);
    setState({ mode: 'idle', preview: [], errors: [], skipped: 0, done: true, imported: pendingRestore.applications.length });
  };

  const templateURL = (() => {
    const header = CSV_COLUMNS.join(',');
    const example = ['Acme Corp', 'Frontend Engineer', 'Bangalore India', 'https://example.com/job', 'applied', '1200000', '1800000', 'INR', '2024-11-01', 'LinkedIn', 'Job description here'].join(',');
    const csv = `${header}\n${example}`;
    return 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <TopBar title="Import / Export" />
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 740, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Export section */}
          <Section title="Export Backup" desc="Download a versioned JSON backup compatible with the JobPilot Android app.">
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleExport} disabled={exporting} style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--color-jp-accent)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Download size={14} /> {exporting ? 'Exporting…' : 'Export JSON Backup'}
              </button>
            </div>
          </Section>

          {/* CSV Import */}
          <Section title="Import from CSV" desc="Import multiple applications from a spreadsheet. Download the template to see the expected format.">
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <a href={templateURL} download="jobpilot_import_template.csv">
                <button style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-jp-border)', background: 'var(--color-jp-surface)', fontSize: 13, cursor: 'pointer', color: 'var(--color-jp-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={14} /> Download Template
                </button>
              </a>
              <label style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-jp-border)', background: 'var(--color-jp-surface)', fontSize: 13, cursor: 'pointer', color: 'var(--color-jp-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Upload size={14} /> Upload CSV
                <input type="file" accept=".csv" onChange={handleCSVUpload} style={{ display: 'none' }} />
              </label>
            </div>

            {state.mode === 'csv' && csvData && !state.done && (
              <>
                {/* Column mapping */}
                <div style={{ background: 'var(--color-jp-surface)', border: '1px solid var(--color-jp-border)', borderRadius: 10, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-jp-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Column Mapping ({csvData.rows.length} rows detected)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {csvData.headers.map(h => (
                      <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--color-jp-secondary)', minWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h}</span>
                        <span style={{ color: 'var(--color-jp-secondary)', fontSize: 12 }}>→</span>
                        <select
                          value={columnMap[h] ?? ''}
                          onChange={e => setColumnMap(m => ({ ...m, [h]: e.target.value }))}
                          style={{ flex: 1, height: 30, padding: '0 8px', border: '1px solid var(--color-jp-border)', borderRadius: 6, fontSize: 12, background: 'var(--color-jp-bg)', color: 'var(--color-jp-text)' }}
                        >
                          <option value="">— ignore —</option>
                          {CSV_COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={handleCSVPreview} style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--color-jp-accent)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 12 }}>
                  Preview Import
                </button>

                {state.errors.length > 0 && (
                  <div style={{ background: 'var(--color-status-rejected-bg)', border: '1px solid var(--color-status-rejected)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                    {state.errors.map((e, i) => <div key={i} style={{ fontSize: 12, color: 'var(--color-status-rejected)' }}>{e}</div>)}
                  </div>
                )}

                {state.preview.length > 0 && (
                  <>
                    <div style={{ background: 'var(--color-jp-surface)', border: '1px solid var(--color-jp-border)', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: 'var(--color-jp-surface2)', borderBottom: '1px solid var(--color-jp-border)' }}>
                            {['Company', 'Job Title', 'Location', 'Status', 'Salary'].map(h => (
                              <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--color-jp-secondary)', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {state.preview.slice(0, 20).map((app, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--color-jp-border)' }}>
                              <td style={{ padding: '8px 10px', color: 'var(--color-jp-text)' }}>{app.company_name}</td>
                              <td style={{ padding: '8px 10px', color: 'var(--color-jp-text)' }}>{app.job_title}</td>
                              <td style={{ padding: '8px 10px', color: 'var(--color-jp-secondary)' }}>{app.location ?? '—'}</td>
                              <td style={{ padding: '8px 10px' }}><span style={{ fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'var(--color-jp-surface2)', color: 'var(--color-jp-text)' }}>{app.status}</span></td>
                              <td style={{ padding: '8px 10px', color: 'var(--color-jp-secondary)' }}>{app.salary_min ? `${app.currency ?? ''}${app.salary_min.toLocaleString()}` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {state.preview.length > 20 && <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--color-jp-secondary)' }}>…and {state.preview.length - 20} more</div>}
                    </div>
                    <button onClick={handleCSVImport} style={{ padding: '8px 20px', borderRadius: 8, background: 'var(--color-jp-accent)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Import {state.preview.length} Applications
                    </button>
                  </>
                )}
              </>
            )}

            {state.done && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--color-status-offer-bg)', borderRadius: 8, fontSize: 13, color: 'var(--color-status-offer)' }}>
                <CheckCircle size={16} /> Imported {state.imported} applications{state.skipped > 0 ? `, skipped ${state.skipped} duplicates` : ''}.
              </div>
            )}
          </Section>

          {/* JSON Restore */}
          <Section title="Restore from Android Backup" desc="Import a JSON backup exported from the JobPilot Android app. This merges data without overwriting existing records.">
            <label style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-jp-border)', background: 'var(--color-jp-surface)', fontSize: 13, cursor: 'pointer', color: 'var(--color-jp-text)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Upload size={14} /> Load JSON Backup
              <input type="file" accept=".json" onChange={handleJSONUpload} style={{ display: 'none' }} />
            </label>

            {pendingRestore && (
              <div style={{ marginTop: 14, padding: 16, background: 'var(--color-jp-surface)', border: '1px solid var(--color-jp-border)', borderRadius: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-jp-text)', marginBottom: 8 }}>Backup loaded successfully</div>
                <div style={{ fontSize: 12, color: 'var(--color-jp-secondary)', marginBottom: 12 }}>
                  {pendingRestore.applications.length} applications · {pendingRestore.companies.length} companies · Exported {new Date(pendingRestore.exported_at).toLocaleDateString()}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setRestoreConfirm(true)} style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--color-jp-accent)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Merge (keep existing data)
                  </button>
                  <button onClick={() => { setPendingRestore(null); }} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-jp-border)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'var(--color-jp-text)' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </Section>
        </div>
      </div>

      {restoreConfirm && pendingRestore && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--color-jp-surface)', borderRadius: 12, padding: 24, maxWidth: 380, width: '90%' }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--color-jp-text)' }}>Merge backup data?</div>
            <div style={{ fontSize: 13, color: 'var(--color-jp-secondary)', marginBottom: 20 }}>
              New records from the Android backup will be added. Existing web records will not be overwritten.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setRestoreConfirm(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-jp-border)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'var(--color-jp-text)' }}>Cancel</button>
              <button onClick={handleRestoreConfirm} style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--color-jp-accent)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Merge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-jp-surface)', border: '1px solid var(--color-jp-border)', borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-jp-text)', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--color-jp-secondary)', marginBottom: 16 }}>{desc}</div>
      {children}
    </div>
  );
}
