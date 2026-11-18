import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Briefcase, Building2, TrendingUp, ArrowRight, Plus } from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { StatusBadge } from '@/components/StatusBadge';
import { CompanyAvatar } from '@/components/CompanyAvatar';
import { getApplicationStats, getAllApplications } from '@/lib/db';
import { ApplicationListItem, ApplicationStatus } from '@/types';
import { ALL_STATUSES, STATUS_LABELS } from '@/lib/statusHelpers';
import { formatRelative, formatSalary } from '@/lib/helpers';

interface Stats {
  total: number; saved: number; applied: number; assessment: number;
  interview: number; offer: number; rejected: number; withdrawn: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<ApplicationListItem[]>([]);

  useEffect(() => {
    getApplicationStats().then(setStats);
    getAllApplications().then(apps => setRecent(apps.slice(0, 8)));
  }, []);

  const active = stats ? stats.applied + stats.assessment + stats.interview : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <TopBar title="Dashboard" />
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

        {/* Welcome */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-jp-text)', marginBottom: 4 }}>
            {getGreeting()}
          </div>
          <div style={{ fontSize: 14, color: 'var(--color-jp-secondary)' }}>
            Here's your job search overview.
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
          <Link to="/applications/new" style={{ textDecoration: 'none' }}>
            <QuickAction icon={<Plus size={16} />} label="New Application" primary />
          </Link>
          <Link to="/quick-add" style={{ textDecoration: 'none' }}>
            <QuickAction icon={<Zap size={16} />} label="Quick Add" />
          </Link>
          <Link to="/applications" style={{ textDecoration: 'none' }}>
            <QuickAction icon={<Briefcase size={16} />} label="All Applications" />
          </Link>
          <Link to="/import" style={{ textDecoration: 'none' }}>
            <QuickAction icon={<TrendingUp size={16} />} label="Import CSV" />
          </Link>
        </div>

        {stats && stats.total === 0 && (
          <EmptyDashboard />
        )}

        {stats && stats.total > 0 && (
          <>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
              <StatCard label="Total" value={stats.total} />
              <StatCard label="Active" value={active} accent />
              <StatCard label="Interview" value={stats.interview} color="var(--color-status-interview)" />
              <StatCard label="Offers" value={stats.offer} color="var(--color-status-offer)" />
              <StatCard label="Rejected" value={stats.rejected} color="var(--color-status-rejected)" />
            </div>

            {/* Pipeline bar */}
            <PipelineBar stats={stats} />

            {/* Recent applications */}
            {recent.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-jp-text)' }}>Recent Applications</div>
                  <Link to="/applications" style={{ fontSize: 12, color: 'var(--color-jp-accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    View all <ArrowRight size={12} />
                  </Link>
                </div>
                <div style={{ background: 'var(--color-jp-surface)', border: '1px solid var(--color-jp-border)', borderRadius: 10, overflow: 'hidden' }}>
                  {recent.map((app, i) => (
                    <Link key={app.id} to={`/applications/${app.id}`} style={{ textDecoration: 'none' }}>
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                          borderBottom: i < recent.length - 1 ? '1px solid var(--color-jp-border)' : 'none',
                        }}
                      >
                        <CompanyAvatar name={app.company_name} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-jp-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {app.job_title}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--color-jp-secondary)' }}>{app.company_name}</div>
                        </div>
                        <StatusBadge status={app.status} size="sm" />
                        <div style={{ fontSize: 12, color: 'var(--color-jp-secondary)', minWidth: 60, textAlign: 'right' }}>
                          {formatRelative(app.created_at)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function QuickAction({ icon, label, primary }: { icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
      border: `1px solid ${primary ? 'var(--color-jp-accent)' : 'var(--color-jp-border)'}`,
      background: primary ? 'var(--color-jp-accent)' : 'var(--color-jp-surface)',
      color: primary ? '#fff' : 'var(--color-jp-text)',
      cursor: 'pointer',
    }}>
      {icon} {label}
    </div>
  );
}

function StatCard({ label, value, accent, color }: { label: string; value: number; accent?: boolean; color?: string }) {
  return (
    <div style={{
      background: 'var(--color-jp-surface)', border: '1px solid var(--color-jp-border)',
      borderRadius: 10, padding: '14px 16px',
    }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: color ?? (accent ? 'var(--color-jp-accent)' : 'var(--color-jp-text)') }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-jp-secondary)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function PipelineBar({ stats }: { stats: Stats }) {
  const statuses: ApplicationStatus[] = ['saved', 'applied', 'assessment', 'interview', 'offer', 'rejected', 'withdrawn'];
  const total = stats.total;
  if (total === 0) return null;

  return (
    <div style={{ background: 'var(--color-jp-surface)', border: '1px solid var(--color-jp-border)', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-jp-secondary)', marginBottom: 10 }}>APPLICATION PIPELINE</div>
      <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', height: 8, gap: 1 }}>
        {statuses.map(s => {
          const count = (stats as unknown as Record<string, number>)[s] ?? 0;
          const pct = (count / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={s}
              style={{ flex: pct, background: `var(--color-status-${s})`, minWidth: 2, transition: 'flex 0.3s' }}
              title={`${STATUS_LABELS[s]}: ${count}`}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
        {statuses.map(s => {
          const count = (stats as unknown as Record<string, number>)[s] ?? 0;
          if (count === 0) return null;
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: `var(--color-status-${s})` }} />
              <span style={{ color: 'var(--color-jp-secondary)' }}>{STATUS_LABELS[s]}</span>
              <span style={{ color: 'var(--color-jp-text)', fontWeight: 600 }}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '60px 24px', textAlign: 'center',
    }}>
      <Briefcase size={40} style={{ color: 'var(--color-jp-border)', marginBottom: 16 }} />
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-jp-text)', marginBottom: 8 }}>
        No applications yet
      </div>
      <div style={{ fontSize: 14, color: 'var(--color-jp-secondary)', marginBottom: 20, maxWidth: 320 }}>
        Paste a job description to create your first opportunity, or import existing applications from a CSV or JSON backup.
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/applications/new" style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '8px 16px', borderRadius: 8, background: 'var(--color-jp-accent)', color: '#fff',
            border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Plus size={14} /> New Application
          </button>
        </Link>
        <Link to="/quick-add" style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '8px 16px', borderRadius: 8, background: 'var(--color-jp-surface)',
            border: '1px solid var(--color-jp-border)', color: 'var(--color-jp-text)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Zap size={14} color="var(--color-jp-accent)" /> Quick Add
          </button>
        </Link>
        <Link to="/import" style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '8px 16px', borderRadius: 8, background: 'var(--color-jp-surface)',
            border: '1px solid var(--color-jp-border)', color: 'var(--color-jp-text)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>Import CSV / JSON</button>
        </Link>
      </div>
    </div>
  );
}
