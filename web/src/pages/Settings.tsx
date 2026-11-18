import React, { useState, useEffect } from 'react';
import { TopBar } from '@/components/TopBar';
import { useTheme } from '@/contexts/ThemeContext';
import { db } from '@/lib/db';
import { Link } from 'react-router-dom';
import { 
  Moon, 
  Sun, 
  Trash2, 
  Download, 
  Upload, 
  Smartphone, 
  ShieldCheck, 
  Database,
  Info,
  AlertTriangle
} from 'lucide-react';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState({ applications: 0, companies: 0 });
  const [showClearModal, setShowClearModal] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    try {
      const dbStats = await db.getStats();
      const companies = await db.getCompanies();
      setStats({
        applications: dbStats.total,
        companies: companies.length,
      });
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClearData = async () => {
    try {
      await db.clearAllData();
      setShowClearModal(false);
      setMessage({ text: 'All data has been cleared from local storage.', type: 'success' });
      await loadData();
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to clear data.', type: 'error' });
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <TopBar title="Settings" />

      <div style={{ padding: '24px 32px', maxWidth: '800px', width: '100%' }}>
        {message && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '13px',
              background: message.type === 'success' ? 'rgba(74, 122, 89, 0.15)' : 'rgba(196, 85, 74, 0.15)',
              color: message.type === 'success' ? 'var(--color-jp-success)' : 'var(--color-jp-error)',
              border: `1px solid ${message.type === 'success' ? 'var(--color-jp-success)' : 'var(--color-jp-error)'}`,
            }}
          >
            {message.text}
          </div>
        )}

        {/* Appearance */}
        <section
          style={{
            background: 'var(--color-jp-surface)',
            border: '1px solid var(--color-jp-border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-jp-text)', marginBottom: '8px' }}>
            Appearance
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-jp-text-muted)', marginBottom: '20px' }}>
            Customize the look and feel of the JobPilot Desktop Web Companion.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-jp-text)' }}>Interface Theme</div>
              <div style={{ fontSize: '12px', color: 'var(--color-jp-text-muted)' }}>
                Current theme: <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{theme}</span>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--color-jp-border)',
                background: 'var(--color-jp-bg)',
                color: 'var(--color-jp-text)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              Switch to {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </section>

        {/* Data & Storage */}
        <section
          style={{
            background: 'var(--color-jp-surface)',
            border: '1px solid var(--color-jp-border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Database size={18} color="var(--color-jp-primary)" />
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-jp-text)' }}>
              Data & Local Storage
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-jp-text-muted)', marginBottom: '20px' }}>
            Your records are stored securely offline in your browser's IndexedDB database.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              padding: '16px',
              background: 'var(--color-jp-bg)',
              borderRadius: '8px',
              border: '1px solid var(--color-jp-border)',
              marginBottom: '20px',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: 'var(--color-jp-text-muted)' }}>Saved Applications</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-jp-text)' }}>{stats.applications}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--color-jp-text-muted)' }}>Registered Companies</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-jp-text)' }}>{stats.companies}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              to="/import"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--color-jp-border)',
                background: 'var(--color-jp-bg)',
                color: 'var(--color-jp-text)',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <Download size={14} /> Backup & Export
            </Link>
            <Link
              to="/import"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--color-jp-border)',
                background: 'var(--color-jp-bg)',
                color: 'var(--color-jp-text)',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <Upload size={14} /> Import CSV or JSON
            </Link>
          </div>
        </section>

        {/* Android Synchronization Architecture */}
        <section
          style={{
            background: 'var(--color-jp-surface)',
            border: '1px solid var(--color-jp-border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Smartphone size={18} color="var(--color-jp-primary)" />
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-jp-text)' }}>
              Android Synchronization
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-jp-text-muted)', marginBottom: '16px', lineHeight: 1.6 }}>
            JobPilot uses a unified, offline-first data model. The desktop companion and Android application share identical data structures (v1 Schema).
          </p>

          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--color-jp-bg)',
              border: '1px solid var(--color-jp-border)',
              fontSize: '13px',
              lineHeight: 1.6,
              color: 'var(--color-jp-text)',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '6px' }}>How to transfer data with Android:</div>
            <ol style={{ paddingLeft: '20px', margin: 0, color: 'var(--color-jp-text-muted)' }}>
              <li style={{ marginBottom: '4px' }}>
                <strong>Export from Desktop:</strong> Go to <Link to="/import" style={{ color: 'var(--color-jp-primary)' }}>Import / Export</Link> and click "Download Backup File (.json)".
              </li>
              <li style={{ marginBottom: '4px' }}>
                <strong>Import into Android:</strong> Transfer the JSON file to your phone and open JobPilot &gt; Settings &gt; Restore Backup.
              </li>
              <li>
                <strong>Android to Desktop:</strong> Export a JSON backup from the Android app and upload it via the Import / Export section here.
              </li>
            </ol>
          </div>
        </section>

        {/* Danger Zone */}
        <section
          style={{
            background: 'var(--color-jp-surface)',
            border: '1px solid var(--color-jp-border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertTriangle size={18} color="var(--color-jp-error)" />
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-jp-error)' }}>
              Danger Zone
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-jp-text-muted)', marginBottom: '16px' }}>
            Permanently erase all local applications, companies, and cached data stored in this browser.
          </p>

          <button
            onClick={() => setShowClearModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--color-jp-error)',
              background: 'rgba(196, 85, 74, 0.1)',
              color: 'var(--color-jp-error)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <Trash2 size={14} /> Clear All Local Data
          </button>
        </section>

        {/* About & Version */}
        <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--color-jp-text-muted)', fontSize: '12px' }}>
          <div><strong>JobPilot Web Companion</strong> — v1.0.0</div>
          <div>Compatible with JobPilot Android v1.0.0 (Data Contract v1)</div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showClearModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'var(--color-jp-surface)',
              border: '1px solid var(--color-jp-border)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '420px',
              width: '90%',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-jp-text)', marginBottom: '8px' }}>
              Clear All Data?
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-jp-text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
              This will remove all {stats.applications} applications and {stats.companies} companies stored in your browser. This action cannot be undone unless you have a JSON backup file.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowClearModal(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-jp-border)',
                  background: 'transparent',
                  color: 'var(--color-jp-text)',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--color-jp-error)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
