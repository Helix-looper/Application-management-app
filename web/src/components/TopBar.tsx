import React from 'react';
import { Moon, Sun, Search } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface TopBarProps {
  title: string;
  search?: string;
  onSearch?: (val: string) => void;
  actions?: React.ReactNode;
}

export function TopBar({ title, search, onSearch, actions }: TopBarProps) {
  const { theme, toggle } = useTheme();

  return (
    <header
      style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 24px',
        background: 'var(--color-jp-surface)',
        borderBottom: '1px solid var(--color-jp-border)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-jp-text)', margin: 0, flex: '0 0 auto' }}>
        {title}
      </h1>

      {onSearch !== undefined && (
        <div style={{ flex: 1, maxWidth: 360, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-jp-secondary)' }} />
          <input
            value={search ?? ''}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search…"
            style={{
              width: '100%',
              height: 32,
              paddingLeft: 32,
              paddingRight: 12,
              border: '1px solid var(--color-jp-border)',
              borderRadius: 6,
              fontSize: 13,
              background: 'var(--color-jp-bg)',
              color: 'var(--color-jp-text)',
              outline: 'none',
            }}
          />
        </div>
      )}

      <div style={{ flex: 1 }} />

      {actions}

      <button
        onClick={toggle}
        style={{
          width: 32, height: 32,
          borderRadius: 6,
          border: '1px solid var(--color-jp-border)',
          background: 'var(--color-jp-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--color-jp-secondary)',
        }}
      >
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
      </button>
    </header>
  );
}
