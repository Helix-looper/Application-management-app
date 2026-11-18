import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Edit2, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { CompanyAvatar } from '@/components/CompanyAvatar';
import { getApplicationById, updateApplicationStatus, deleteApplication } from '@/lib/db';
import { ApplicationListItem, ApplicationStatus } from '@/types';
import { ALL_STATUSES, STATUS_LABELS } from '@/lib/statusHelpers';
import { formatDate, formatSalary } from '@/lib/helpers';

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<ApplicationListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (id) getApplicationById(id).then(a => { setApp(a); setLoading(false); });
  }, [id]);

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!app) return;
    await updateApplicationStatus(app.id, newStatus, app.status);
    setApp(a => a ? { ...a, status: newStatus } : a);
  };

  const handleDelete = async () => {
    if (!app) return;
    await deleteApplication(app.id);
    navigate('/applications');
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--color-jp-secondary)', fontSize: 14 }}>Loading…</div>;
  if (!app) return <div style={{ padding: 40, color: 'var(--color-jp-secondary)', fontSize: 14 }}>Application not found.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Sub-header */}
      <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--color-jp-border)', background: 'var(--color-jp-surface)', flexShrink: 0 }}>
        <button onClick={() => navigate('/applications')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--color-jp-border)', background: 'transparent', fontSize: 13, color: 'var(--color-jp-secondary)', cursor: 'pointer' }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ flex: 1 }} />
        <select
          value={app.status}
          onChange={e => handleStatusChange(e.target.value as ApplicationStatus)}
          style={{ height: 32, padding: '0 10px', borderRadius: 6, border: '1px solid var(--color-jp-border)', background: 'var(--color-jp-bg)', color: 'var(--color-jp-text)', fontSize: 13 }}
        >
          {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        {app.job_url && (
          <a href={app.job_url} target="_blank" rel="noopener noreferrer">
            <button style={{ height: 32, padding: '0 12px', borderRadius: 6, border: '1px solid var(--color-jp-border)', background: 'var(--color-jp-surface)', fontSize: 13, cursor: 'pointer', color: 'var(--color-jp-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ExternalLink size={13} /> Open Job
            </button>
          </a>
        )}
        <button onClick={() => setConfirmDelete(true)} style={{ height: 32, width: 32, borderRadius: 6, border: '1px solid var(--color-status-rejected)', background: 'var(--color-status-rejected-bg)', color: 'var(--color-status-rejected)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Trash2 size={14} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>

          {/* Title block */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 24 }}>
            <CompanyAvatar name={app.company_name} size={48} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-jp-text)', marginBottom: 4 }}>{app.job_title}</div>
              <div style={{ fontSize: 15, color: 'var(--color-jp-secondary)', marginBottom: 8 }}>{app.company_name}</div>
              <StatusBadge status={app.status} />
            </div>
          </div>

          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--color-jp-border)', borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
            {[
              { label: 'Location', value: app.location },
              { label: 'Employment', value: app.employment_type },
              { label: 'Arrangement', value: app.work_arrangement },
              { label: 'Salary', value: formatSalary(app.salary_min, app.salary_max, app.currency) },
              { label: 'Source', value: app.source },
              { label: 'Added', value: formatDate(app.created_at) },
              { label: 'Applied', value: app.applied_at ? formatDate(app.applied_at) : '—' },
              { label: 'Recruiter', value: app.recruiter_name },
              { label: 'Recruiter Email', value: app.recruiter_email },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '12px 16px', background: 'var(--color-jp-surface)' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-jp-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 13, color: value ? 'var(--color-jp-text)' : 'var(--color-jp-secondary)' }}>{value || '—'}</div>
              </div>
            ))}
          </div>

          {/* Job Description */}
          {app.job_description && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-jp-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 10 }}>Job Description</div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--color-jp-text)', background: 'var(--color-jp-surface)', border: '1px solid var(--color-jp-border)', borderRadius: 10, padding: 16, whiteSpace: 'pre-wrap' }}>
                {app.job_description}
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--color-jp-surface)', borderRadius: 12, padding: 24, maxWidth: 360, width: '90%' }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--color-jp-text)' }}>Delete this application?</div>
            <div style={{ fontSize: 13, color: 'var(--color-jp-secondary)', marginBottom: 20 }}>{app.job_title} at {app.company_name}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-jp-border)', background: 'var(--color-jp-surface)', fontSize: 13, cursor: 'pointer', color: 'var(--color-jp-text)' }}>Cancel</button>
              <button onClick={handleDelete} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--color-jp-error)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
