import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { StatusBadge } from '@/components/StatusBadge';
import { extractJobFromText, ExtractedJob } from '@/lib/parser';
import { createApplication, upsertCompany, getAllCompanies } from '@/lib/db';
import { ApplicationStatus, EmploymentType, WorkArrangement } from '@/types';
import { ALL_STATUSES, STATUS_LABELS } from '@/lib/statusHelpers';
import { generateId, nowISO } from '@/lib/helpers';

export default function QuickAdd() {
  const navigate = useNavigate();
  const [rawText, setRawText] = useState('');
  const [url, setUrl] = useState('');
  const [extracted, setExtracted] = useState<ExtractedJob | null>(null);
  const [form, setForm] = useState<Partial<{
    job_title: string; company_name: string; location: string;
    employment_type: EmploymentType; work_arrangement: WorkArrangement;
    salary_min: string; salary_max: string; currency: string;
    status: ApplicationStatus; source: string; job_url: string; job_description: string;
  }>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleExtract = () => {
    if (!rawText.trim()) return;
    const result = extractJobFromText(rawText, url || undefined);
    setExtracted(result);
    setForm({
      job_title: result.job_title ?? '',
      company_name: result.company_name ?? '',
      location: result.location ?? '',
      employment_type: result.employment_type as EmploymentType | undefined,
      work_arrangement: result.work_arrangement as WorkArrangement | undefined,
      salary_min: result.salary_min?.toString() ?? '',
      salary_max: result.salary_max?.toString() ?? '',
      currency: result.currency ?? 'USD',
      status: 'saved',
      source: result.source ?? '',
      job_url: url || result.job_url || '',
      job_description: result.job_description ?? rawText.slice(0, 5000),
    });
  };

  const handleSave = async () => {
    if (!form.job_title?.trim()) { setError('Job title is required'); return; }
    if (!form.company_name?.trim()) { setError('Company name is required'); return; }
    setError('');
    setSaving(true);

    try {
      // Upsert company
      const companies = await getAllCompanies();
      let company = companies.find(c => c.name.toLowerCase() === form.company_name!.toLowerCase());
      if (!company) {
        company = await upsertCompany({ name: form.company_name! });
      }

      await createApplication({
        company_id: company.id,
        job_title: form.job_title!.trim(),
        job_url: form.job_url || null,
        job_description: form.job_description || null,
        location: form.location || null,
        employment_type: form.employment_type || null,
        work_arrangement: form.work_arrangement || null,
        salary_min: form.salary_min ? parseFloat(form.salary_min) : null,
        salary_max: form.salary_max ? parseFloat(form.salary_max) : null,
        currency: form.currency || 'USD',
        status: form.status ?? 'saved',
        source: form.source || null,
        recruiter_name: null, recruiter_email: null,
        recruiter_phone: null, recruiter_linkedin: null, resume_id: null,
        applied_at: null,
      });

      setSaved(true);
      setTimeout(() => { navigate('/applications'); }, 1200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setRawText(text);
    } catch {}
  };

  const Field = ({ label, name, placeholder, type }: { label: string; name: keyof typeof form; placeholder?: string; type?: string }) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-jp-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</label>
      <input
        type={type ?? 'text'}
        value={(form[name] as string) ?? ''}
        onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
        placeholder={placeholder}
        style={{ width: '100%', height: 34, padding: '0 10px', border: '1px solid var(--color-jp-border)', borderRadius: 6, fontSize: 13, background: 'var(--color-jp-bg)', color: 'var(--color-jp-text)', outline: 'none' }}
      />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <TopBar title="Quick Add" />

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          <div style={{ fontSize: 14, color: 'var(--color-jp-secondary)', marginBottom: 20, maxWidth: 560 }}>
            Paste a job description from LinkedIn, Indeed, Naukri, or any company careers page. JobPilot will extract the relevant details for you to review and save.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Left — Paste area */}
            <div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-jp-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Job Description</label>
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={rawText}
                    onChange={e => setRawText(e.target.value)}
                    placeholder="Paste the full job description here…"
                    style={{
                      width: '100%', height: 320, padding: 12,
                      border: '1px solid var(--color-jp-border)', borderRadius: 8,
                      fontSize: 13, lineHeight: 1.6,
                      background: 'var(--color-jp-surface)', color: 'var(--color-jp-text)',
                      resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                  {!rawText && (
                    <button
                      onClick={handlePaste}
                      style={{ position: 'absolute', bottom: 12, right: 12, padding: '6px 12px', borderRadius: 6, border: '1px solid var(--color-jp-border)', background: 'var(--color-jp-bg)', fontSize: 12, cursor: 'pointer', color: 'var(--color-jp-secondary)' }}
                    >
                      Paste from clipboard
                    </button>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-jp-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Job URL (optional)</label>
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://…"
                  style={{ width: '100%', height: 34, padding: '0 10px', border: '1px solid var(--color-jp-border)', borderRadius: 6, fontSize: 13, background: 'var(--color-jp-bg)', color: 'var(--color-jp-text)', outline: 'none' }}
                />
              </div>

              <button
                onClick={handleExtract}
                disabled={!rawText.trim()}
                style={{
                  width: '100%', height: 40, borderRadius: 8,
                  background: rawText.trim() ? 'var(--color-jp-accent)' : 'var(--color-jp-border)',
                  color: rawText.trim() ? '#fff' : 'var(--color-jp-secondary)',
                  border: 'none', fontSize: 14, fontWeight: 600, cursor: rawText.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Zap size={16} /> Extract Job Details
              </button>

              {/* Skills preview */}
              {extracted?.skills && extracted.skills.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-jp-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Detected Skills</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {extracted.skills.map(s => (
                      <span key={s} style={{ padding: '3px 8px', borderRadius: 4, background: 'var(--color-jp-surface2)', border: '1px solid var(--color-jp-border)', fontSize: 12, color: 'var(--color-jp-text)' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {extracted?.experience_years && (
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-jp-secondary)' }}>
                  <strong>Experience:</strong> {extracted.experience_years}
                </div>
              )}
            </div>

            {/* Right — Extracted form */}
            <div>
              {!extracted ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-jp-secondary)', textAlign: 'center', padding: 32 }}>
                  <Zap size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <div style={{ fontSize: 14 }}>Extracted job details will appear here after you click Extract.</div>
                </div>
              ) : (
                <div style={{ background: 'var(--color-jp-surface)', border: '1px solid var(--color-jp-border)', borderRadius: 10, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-jp-text)', marginBottom: 16 }}>Review & Edit</div>

                  <Field label="Job Title *" name="job_title" placeholder="e.g. Senior Frontend Engineer" />
                  <Field label="Company Name *" name="company_name" placeholder="e.g. Acme Corp" />
                  <Field label="Location" name="location" placeholder="e.g. Bangalore, India" />
                  <Field label="Job URL" name="job_url" placeholder="https://…" />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-jp-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Employment Type</label>
                      <select value={form.employment_type ?? ''} onChange={e => setForm(f => ({ ...f, employment_type: e.target.value as EmploymentType }))} style={{ width: '100%', height: 34, padding: '0 10px', border: '1px solid var(--color-jp-border)', borderRadius: 6, fontSize: 13, background: 'var(--color-jp-bg)', color: 'var(--color-jp-text)' }}>
                        <option value="">—</option>
                        {(['full-time', 'part-time', 'contract', 'freelance', 'internship', 'other'] as EmploymentType[]).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-jp-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Work Arrangement</label>
                      <select value={form.work_arrangement ?? ''} onChange={e => setForm(f => ({ ...f, work_arrangement: e.target.value as WorkArrangement }))} style={{ width: '100%', height: 34, padding: '0 10px', border: '1px solid var(--color-jp-border)', borderRadius: 6, fontSize: 13, background: 'var(--color-jp-bg)', color: 'var(--color-jp-text)' }}>
                        <option value="">—</option>
                        {(['remote', 'hybrid', 'on-site'] as WorkArrangement[]).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 10, marginBottom: 12 }}>
                    <Field label="Salary Min" name="salary_min" type="number" placeholder="e.g. 1200000" />
                    <Field label="Salary Max" name="salary_max" type="number" placeholder="e.g. 1800000" />
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-jp-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Currency</label>
                      <select value={form.currency ?? 'USD'} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} style={{ width: '100%', height: 34, padding: '0 6px', border: '1px solid var(--color-jp-border)', borderRadius: 6, fontSize: 13, background: 'var(--color-jp-bg)', color: 'var(--color-jp-text)' }}>
                        {['USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-jp-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Status</label>
                      <select value={form.status ?? 'saved'} onChange={e => setForm(f => ({ ...f, status: e.target.value as ApplicationStatus }))} style={{ width: '100%', height: 34, padding: '0 10px', border: '1px solid var(--color-jp-border)', borderRadius: 6, fontSize: 13, background: 'var(--color-jp-bg)', color: 'var(--color-jp-text)' }}>
                        {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    </div>
                    <Field label="Source" name="source" placeholder="e.g. LinkedIn" />
                  </div>

                  {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--color-status-rejected-bg)', borderRadius: 6, marginBottom: 12, fontSize: 13, color: 'var(--color-status-rejected)' }}>
                      <AlertCircle size={14} /> {error}
                    </div>
                  )}

                  {saved ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--color-status-offer-bg)', borderRadius: 6, fontSize: 13, color: 'var(--color-status-offer)' }}>
                      <CheckCircle size={14} /> Saved! Redirecting…
                    </div>
                  ) : (
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{ width: '100%', height: 40, borderRadius: 8, background: 'var(--color-jp-accent)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}
                    >
                      {saving ? 'Saving…' : 'Save Application'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
