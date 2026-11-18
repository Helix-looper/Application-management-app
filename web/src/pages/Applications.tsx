import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronDown, Filter, ArrowUpDown, Zap } from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { StatusBadge } from '@/components/StatusBadge';
import { CompanyAvatar } from '@/components/CompanyAvatar';
import { getAllApplications, bulkDeleteApplications, bulkUpdateStatus } from '@/lib/db';
import { ApplicationListItem, ApplicationStatus } from '@/types';
import { ALL_STATUSES, STATUS_LABELS } from '@/lib/statusHelpers';
import { formatDate, formatSalary } from '@/lib/helpers';

type SortKey = 'created_at' | 'company_name' | 'job_title' | 'status';
type SortDir = 'asc' | 'desc';

export default function Applications() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<ApplicationListItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'created_at', dir: 'desc' });
  const [loading, setLoading] = useState(true);
  const [bulkStatusPicker, setBulkStatusPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = () => {
    setLoading(true);
    getAllApplications().then(a => { setApps(a); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = [...apps];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.job_title.toLowerCase().includes(q) ||
        a.company_name.toLowerCase().includes(q) ||
        (a.location ?? '').toLowerCase().includes(q)
      );
    }
    if (statusFilter) list = list.filter(a => a.status === statusFilter);

    list.sort((a, b) => {
      let va: string = String((a as unknown as Record<string, unknown>)[sort.key] ?? '');
      let vb: string = String((b as unknown as Record<string, unknown>)[sort.key] ?? '');
      return sort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [apps, search, statusFilter, sort]);

  const allSelected = filtered.length > 0 && filtered.every(a => selected.has(a.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(a => a.id)));
  };
  const toggleRow = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const handleBulkDelete = async () => {
    await bulkDeleteApplications(Array.from(selected));
    setSelected(new Set());
    setConfirmDelete(false);
    load();
  };

  const handleBulkStatus = async (status: ApplicationStatus) => {
    await bulkUpdateStatus(Array.from(selected), status);
    setSelected(new Set());
    setBulkStatusPicker(false);
    load();
  };

  const handleSort = (key: SortKey) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <TopBar
        title="Applications"
        search={search}
        onSearch={setSearch}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as ApplicationStatus | '')}
              style={{
                height: 32, padding: '0 10px', borderRadius: 6,
                border: '1px solid var(--color-jp-border)',
                background: 'var(--color-jp-bg)', color: 'var(--color-jp-text)',
                fontSize: 13, cursor: 'pointer',
              }}
            >
              <option value="">All Statuses</option>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>

            {/* Bulk actions */}
            {selected.size > 0 && (
              <>
                <span style={{ fontSize: 12, color: 'var(--color-jp-secondary)' }}>{selected.size} selected</span>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setBulkStatusPicker(!bulkStatusPicker)}
                    style={{ height: 32, padding: '0 12px', borderRadius: 6, border: '1px solid var(--color-jp-border)', background: 'var(--color-jp-surface)', fontSize: 13, cursor: 'pointer', color: 'var(--color-jp-text)', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    Set Status <ChevronDown size={12} />
                  </button>
                  {bulkStatusPicker && (
                    <div style={{ position: 'absolute', top: 36, right: 0, background: 'var(--color-jp-surface)', border: '1px solid var(--color-jp-border)', borderRadius: 8, padding: 6, zIndex: 20, minWidth: 160, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                      {ALL_STATUSES.map(s => (
                        <div key={s} onClick={() => handleBulkStatus(s)}
                          style={{ padding: '7px 10px', borderRadius: 6, fontSize: 13, cursor: 'pointer', color: 'var(--color-jp-text)' }}
                          onMouseOver={e => (e.currentTarget.style.background = 'var(--color-jp-surface2)')}
                          onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          {STATUS_LABELS[s]}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setConfirmDelete(true)}
                  style={{ height: 32, width: 32, borderRadius: 6, border: '1px solid var(--color-status-rejected)', background: 'var(--color-status-rejected-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-status-rejected)' }}
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}

            <Link to="/quick-add" style={{ textDecoration: 'none' }}>
              <button
                type="button"
                style={{
                  height: 32,
                  padding: '0 12px',
                  borderRadius: 6,
                  background: 'var(--color-jp-surface)',
                  color: 'var(--color-jp-text)',
                  border: '1px solid var(--color-jp-border)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Zap size={13} color="var(--color-jp-accent)" /> Quick Add
              </button>
            </Link>

            <Link to="/applications/new" style={{ textDecoration: 'none' }}>
              <button
                type="button"
                style={{
                  height: 32,
                  padding: '0 14px',
                  borderRadius: 6,
                  background: 'var(--color-jp-accent)',
                  color: '#fff',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Plus size={14} /> New Application
              </button>
            </Link>
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-jp-secondary)', fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-jp-secondary)', fontSize: 14 }}>
            {apps.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-jp-text)' }}>No applications yet</div>
                <div style={{ fontSize: 13, maxWidth: 380, margin: '0 auto' }}>
                  Track your job opportunities manually or paste a full job posting to parse details automatically.
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <Link to="/applications/new" style={{ textDecoration: 'none' }}>
                    <button style={{ height: 36, padding: '0 16px', borderRadius: 8, background: 'var(--color-jp-accent)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Plus size={14} /> New Application
                    </button>
                  </Link>
                  <Link to="/quick-add" style={{ textDecoration: 'none' }}>
                    <button style={{ height: 36, padding: '0 16px', borderRadius: 8, background: 'var(--color-jp-surface)', color: 'var(--color-jp-text)', border: '1px solid var(--color-jp-border)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Zap size={14} color="var(--color-jp-accent)" /> Quick Add
                    </button>
                  </Link>
                </div>
              </div>
            ) : 'No results match your filters.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--color-jp-surface)', borderBottom: '1px solid var(--color-jp-border)' }}>
                <Th w={40}>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ cursor: 'pointer' }} />
                </Th>
                <Th w={36} />
                <SortTh label="Company" k="company_name" sort={sort} onSort={handleSort} />
                <SortTh label="Job Title" k="job_title" sort={sort} onSort={handleSort} />
                <Th>Location</Th>
                <SortTh label="Status" k="status" sort={sort} onSort={handleSort} />
                <Th>Salary</Th>
                <SortTh label="Added" k="created_at" sort={sort} onSort={handleSort} />
                <Th>Source</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app, i) => (
                <tr
                  key={app.id}
                  onClick={() => navigate(`/applications/${app.id}`)}
                  style={{
                    borderBottom: '1px solid var(--color-jp-border)',
                    background: selected.has(app.id) ? 'var(--color-jp-surface2)' : 'transparent',
                    cursor: 'pointer',
                  }}
                  onMouseOver={e => { if (!selected.has(app.id)) e.currentTarget.style.background = 'var(--color-jp-surface)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = selected.has(app.id) ? 'var(--color-jp-surface2)' : 'transparent'; }}
                >
                  <Td w={40} onClick={e => { e.stopPropagation(); toggleRow(app.id); }}>
                    <input type="checkbox" checked={selected.has(app.id)} onChange={() => toggleRow(app.id)} style={{ cursor: 'pointer' }} />
                  </Td>
                  <Td w={36}><CompanyAvatar name={app.company_name} size={28} /></Td>
                  <Td>{app.company_name}</Td>
                  <Td><span style={{ fontWeight: 500, color: 'var(--color-jp-text)' }}>{app.job_title}</span></Td>
                  <Td style={{ color: 'var(--color-jp-secondary)' }}>{app.location ?? '—'}</Td>
                  <Td><StatusBadge status={app.status} size="sm" /></Td>
                  <Td style={{ color: 'var(--color-jp-secondary)' }}>{formatSalary(app.salary_min, app.salary_max, app.currency)}</Td>
                  <Td style={{ color: 'var(--color-jp-secondary)' }}>{formatDate(app.created_at)}</Td>
                  <Td style={{ color: 'var(--color-jp-secondary)' }}>{app.source ?? '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <ConfirmModal
          message={`Delete ${selected.size} application${selected.size > 1 ? 's' : ''}? This cannot be undone.`}
          onConfirm={handleBulkDelete}
          onCancel={() => setConfirmDelete(false)}
          danger
        />
      )}
    </div>
  );
}

function Th({ children, w, style }: { children?: React.ReactNode; w?: number; style?: React.CSSProperties }) {
  return (
    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.4px', color: 'var(--color-jp-secondary)', textTransform: 'uppercase', width: w, whiteSpace: 'nowrap', ...style }}>
      {children}
    </th>
  );
}

function SortTh({ label, k, sort, onSort }: { label: string; k: SortKey; sort: { key: SortKey; dir: SortDir }; onSort: (k: SortKey) => void }) {
  const active = sort.key === k;
  return (
    <th
      onClick={() => onSort(k)}
      style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.4px', color: active ? 'var(--color-jp-accent)' : 'var(--color-jp-secondary)', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {label} <ArrowUpDown size={10} style={{ opacity: active ? 1 : 0.4 }} />
      </span>
    </th>
  );
}

function Td({ children, w, style, onClick }: { children?: React.ReactNode; w?: number; style?: React.CSSProperties; onClick?: (e: React.MouseEvent) => void }) {
  return <td onClick={onClick} style={{ padding: '10px 12px', width: w, verticalAlign: 'middle', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...style }}>{children}</td>;
}

function ConfirmModal({ message, onConfirm, onCancel, danger }: { message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: 'var(--color-jp-surface)', borderRadius: 12, padding: 24, maxWidth: 360, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--color-jp-text)' }}>{message}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-jp-border)', background: 'var(--color-jp-surface)', fontSize: 13, cursor: 'pointer', color: 'var(--color-jp-text)' }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: danger ? 'var(--color-jp-error)' : 'var(--color-jp-accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
