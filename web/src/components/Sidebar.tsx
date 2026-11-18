import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, Zap, Building2,
  FileDown, Settings, Wifi, PlusCircle
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const NAV = [
  { to: '/',                 icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/applications',     icon: Briefcase,       label: 'Applications' },
  { to: '/applications/new', icon: PlusCircle,      label: 'New Application', accent: true },
  { to: '/quick-add',        icon: Zap,             label: 'Quick Add' },
  { to: '/companies',        icon: Building2,       label: 'Companies' },
  { to: '/sync',             icon: Wifi,            label: 'Wi-Fi Sync' },
  { to: '/import',           icon: FileDown,        label: 'Import / Export' },
  { to: '/settings',         icon: Settings,        label: 'Settings' },
];

export function Sidebar() {
  const { theme } = useTheme();

  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-jp-surface)',
        borderRight: '1px solid var(--color-jp-border)',
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--color-jp-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--color-jp-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>JP</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-jp-text)' }}>JobPilot</div>
            <div style={{ fontSize: 11, color: 'var(--color-jp-secondary)', fontWeight: 500 }}>Web Companion</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '12px 10px', flex: 1 }}>
        {NAV.map(({ to, icon: Icon, label, accent }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              borderRadius: 8,
              marginBottom: 2,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              color: isActive
                ? 'var(--color-jp-accent)'
                : accent
                  ? 'var(--color-jp-accent)'
                  : 'var(--color-jp-secondary)',
              background: isActive ? 'var(--color-jp-surface2)' : 'transparent',
              transition: 'background 0.12s, color 0.12s',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--color-jp-border)',
        fontSize: 11,
        color: 'var(--color-jp-secondary)',
      }}>
        JobPilot v1.0 · Web
      </div>
    </aside>
  );
}
