import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { CompanyAvatar } from '@/components/CompanyAvatar';
import { getAllCompanies, getAllApplications, upsertCompany, deleteCompany } from '@/lib/db';
import { Company, ApplicationListItem } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/helpers';

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [appCounts, setAppCounts] = useState<Record<string, number>>({});
  const [companyApps, setCompanyApps] = useState<Record<string, ApplicationListItem[]>>({});
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [cos, apps] = await Promise.all([getAllCompanies(), getAllApplications()]);
    const counts: Record<string, number> = {};
    const byCompany: Record<string, ApplicationListItem[]> = {};
    for (const a of apps) {
      counts[a.company_id] = (counts[a.company_id] ?? 0) + 1;
      if (!byCompany[a.company_id]) byCompany[a.company_id] = [];
      byCompany[a.company_id].push(a);
    }
    setCompanies(cos.sort((a, b) => a.name.localeCompare(b.name)));
    setAppCounts(counts);
    setCompanyApps(byCompany);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const selectedCo = selected ? companies.find(c => c.id === selected) : null;

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await upsertCompany({ name: newName.trim(), website: newWebsite.trim() || undefined });
    setNewName(''); setNewWebsite(''); setAdding(false);
    load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <TopBar
        title="Companies"
        search={search}
        onSearch={setSearch}
        actions={
          <button onClick={() => setAdding(true)} style={{ height: 32, padding: '0 14px', borderRadius: 6, background: 'var(--color-jp-accent)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Add Company
          </button>
        }
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* List */}
        <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid var(--color-jp-border)', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 24, color: 'var(--color-jp-secondary)', fontSize: 13 }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, color: 'var(--color-jp-secondary)', fontSize: 13 }}>No companies yet.</div>
          ) : (
            filtered.map(co => (
              <div
                key={co.id}
                onClick={() => setSelected(co.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderBottom: '1px solid var(--color-jp-border)', cursor: 'pointer',
                  background: selected === co.id ? 'var(--color-jp-surface2)' : 'transparent',
                }}
              >
                <CompanyAvatar name={co.name} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-jp-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{co.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-jp-secondary)' }}>{appCounts[co.id] ?? 0} application{(appCounts[co.id] ?? 0) !== 1 ? 's' : ''}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {!selectedCo ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-jp-secondary)', fontSize: 14 }}>
              Select a company to view details
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
                <CompanyAvatar name={selectedCo.name} size={48} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-jp-text)' }}>{selectedCo.name}</div>
                  {selectedCo.website && (
                    <a href={selectedCo.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--color-jp-accent)' }}>{selectedCo.website}</a>
                  )}
                  {selectedCo.industry && <div style={{ fontSize: 12, color: 'var(--color-jp-secondary)', marginTop: 2 }}>{selectedCo.industry}</div>}
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-jp-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 10 }}>
                Applications ({appCounts[selectedCo.id] ?? 0})
              </div>
              {(companyApps[selectedCo.id] ?? []).length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--color-jp-secondary)' }}>No applications for this company yet.</div>
              ) : (
                <div style={{ background: 'var(--color-jp-surface)', border: '1px solid var(--color-jp-border)', borderRadius: 10, overflow: 'hidden' }}>
                  {(companyApps[selectedCo.id] ?? []).map((app, i, arr) => (
                    <div key={app.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--color-jp-border)' : 'none' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-jp-text)' }}>{app.job_title}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-jp-secondary)' }}>{formatDate(app.created_at)}</div>
                      </div>
                      <StatusBadge status={app.status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add company modal */}
      {adding && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--color-jp-surface)', borderRadius: 12, padding: 24, maxWidth: 380, width: '90%' }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--color-jp-text)' }}>Add Company</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-jp-secondary)', marginBottom: 4 }}>COMPANY NAME *</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} style={{ width: '100%', height: 34, padding: '0 10px', border: '1px solid var(--color-jp-border)', borderRadius: 6, fontSize: 13, background: 'var(--color-jp-bg)', color: 'var(--color-jp-text)', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-jp-secondary)', marginBottom: 4 }}>WEBSITE</label>
              <input value={newWebsite} onChange={e => setNewWebsite(e.target.value)} placeholder="https://…" style={{ width: '100%', height: 34, padding: '0 10px', border: '1px solid var(--color-jp-border)', borderRadius: 6, fontSize: 13, background: 'var(--color-jp-bg)', color: 'var(--color-jp-text)', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setAdding(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-jp-border)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'var(--color-jp-text)' }}>Cancel</button>
              <button onClick={handleAdd} style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--color-jp-accent)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
