import React, { useState, useEffect } from 'react';
import { TopBar } from '@/components/TopBar';
import { 
  Wifi, 
  Smartphone, 
  RefreshCw, 
  ShieldCheck, 
  Copy, 
  Check, 
  ArrowDownUp, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { exportBackupData, importBackupData } from '@/lib/db';

interface BridgeStatus {
  ok: boolean;
  service: string;
  version: string;
  ip: string;
  port: number;
  pin: string;
  lastSync?: {
    timestamp: string | null;
    device: string | null;
    importedCount: number;
    exportedCount: number;
  };
}

export default function Sync() {
  const [status, setStatus] = useState<BridgeStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        setError(null);
      } else {
        setStatus(null);
        setError('Bridge returned status ' + res.status);
      }
    } catch {
      setStatus(null);
      setError('Sync bridge not detected on port 3001. Run "npm run sync" in the web directory.');
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshPin = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/refresh-pin', { method: 'POST' });
      if (res.ok) {
        await checkStatus();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePushDesktopData = async () => {
    setSyncing(true);
    setFeedback(null);
    try {
      const localData = await exportBackupData();
      const res = await fetch('http://localhost:3001/api/desktop-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localData),
      });
      if (res.ok) {
        const result = await res.json();
        setFeedback(`Pushed ${result.applicationsCount} applications and ${result.companiesCount} companies to sync bridge.`);
      } else {
        setFeedback('Failed to push data to bridge.');
      }
    } catch (err) {
      setFeedback('Error pushing data: ' + String(err));
    } finally {
      setSyncing(false);
    }
  };

  const handlePullFromBridge = async () => {
    setSyncing(true);
    setFeedback(null);
    try {
      const res = await fetch('http://localhost:3001/api/desktop-data');
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.applications) {
          const importRes = await importBackupData(json.data);
          setFeedback(`Pulled from bridge: ${importRes.imported} new records imported (${importRes.skipped} existing skipped).`);
        }
      }
    } catch (err) {
      setFeedback('Error pulling data: ' + String(err));
    } finally {
      setSyncing(false);
    }
  };

  const connectionUrl = status ? `http://${status.ip}:${status.port}` : '';

  const copyUrl = () => {
    if (connectionUrl) {
      navigator.clipboard.writeText(connectionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <TopBar title="Wi-Fi Mobile Sync" />

      <div style={{ padding: '24px 32px', maxWidth: '820px', width: '100%' }}>
        {feedback && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '13px',
              background: 'rgba(74, 122, 89, 0.15)',
              color: 'var(--color-jp-success)',
              border: '1px solid var(--color-jp-success)',
            }}
          >
            {feedback}
          </div>
        )}

        {/* Status Header */}
        <section
          style={{
            background: 'var(--color-jp-surface)',
            border: '1px solid var(--color-jp-border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: status ? 'rgba(74, 122, 89, 0.15)' : 'rgba(196, 85, 74, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Wifi size={20} color={status ? 'var(--color-jp-success)' : 'var(--color-jp-error)'} />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-jp-text)' }}>
                  Local Wi-Fi Pairing
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--color-jp-text-muted)' }}>
                  {status ? 'Desktop bridge active & ready for pairing' : 'Bridge inactive'}
                </div>
              </div>
            </div>

            <button
              onClick={checkStatus}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-jp-border)',
                background: 'var(--color-jp-bg)',
                color: 'var(--color-jp-text)',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              <RefreshCw size={12} /> Check
            </button>
          </div>

          {status ? (
            <div
              style={{
                background: 'var(--color-jp-bg)',
                borderRadius: '10px',
                border: '1px solid var(--color-jp-border)',
                padding: '20px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-jp-text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.4px', marginBottom: '6px' }}>
                    Desktop Local Network Address
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <code
                      style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: 'var(--color-jp-surface)',
                        border: '1px solid var(--color-jp-border)',
                        color: 'var(--color-jp-primary)',
                      }}
                    >
                      {connectionUrl}
                    </code>
                    <button
                      onClick={copyUrl}
                      title="Copy Address"
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-jp-border)',
                        background: 'var(--color-jp-surface)',
                        cursor: 'pointer',
                        color: 'var(--color-jp-text)',
                      }}
                    >
                      {copied ? <Check size={14} color="var(--color-jp-success)" /> : <Copy size={14} />}
                    </button>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--color-jp-text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.4px', marginBottom: '6px' }}>
                    Temporary 4-Digit Pairing PIN
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                      }}
                    >
                      {status.pin.split('').map((digit, i) => (
                        <div
                          key={i}
                          style={{
                            width: '36px',
                            height: '42px',
                            borderRadius: '8px',
                            background: 'var(--color-jp-surface)',
                            border: '1px solid var(--color-jp-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            fontWeight: 700,
                            color: 'var(--color-jp-text)',
                          }}
                        >
                          {digit}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleRefreshPin}
                      disabled={loading}
                      title="Generate new PIN"
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-jp-border)',
                        background: 'var(--color-jp-surface)',
                        fontSize: '11px',
                        color: 'var(--color-jp-text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      Regenerate
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    borderLeft: '1px solid var(--color-jp-border)',
                    paddingLeft: '24px',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-jp-text)', marginBottom: '8px' }}>
                    How to Pair on Android:
                  </div>
                  <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--color-jp-text-muted)', lineHeight: 1.6 }}>
                    <li>Ensure phone & desktop are on the same Wi-Fi.</li>
                    <li>Open <strong>JobPilot</strong> on Android.</li>
                    <li>Go to <strong>Settings &gt; Desktop Sync</strong>.</li>
                    <li>Enter this address and PIN.</li>
                    <li>Tap <strong>Sync Now</strong>.</li>
                  </ol>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: 'rgba(196, 85, 74, 0.08)',
                border: '1px solid rgba(196, 85, 74, 0.2)',
                fontSize: '13px',
                color: 'var(--color-jp-text)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, marginBottom: '6px' }}>
                <AlertCircle size={16} color="var(--color-jp-error)" />
                Sync Bridge Server Not Running
              </div>
              <p style={{ margin: 0, color: 'var(--color-jp-text-muted)', fontSize: '12px' }}>
                To enable live Wi-Fi syncing, run the sync bridge in your terminal:
              </p>
              <code
                style={{
                  display: 'block',
                  margin: '8px 0',
                  padding: '8px 12px',
                  background: 'var(--color-jp-surface)',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              >
                cd web; npm run sync
              </code>
            </div>
          )}
        </section>

        {/* Sync Controls */}
        {status && (
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
              <ArrowDownUp size={18} color="var(--color-jp-primary)" />
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-jp-text)' }}>
                Desktop Data Bridge
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-jp-text-muted)', marginBottom: '16px' }}>
              Publish applications you added on desktop so your Android device can fetch them during sync.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handlePushDesktopData}
                disabled={syncing}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--color-jp-primary)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ArrowDownUp size={14} /> Push Local Applications to Bridge
              </button>

              <button
                onClick={handlePullFromBridge}
                disabled={syncing}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-jp-border)',
                  background: 'var(--color-jp-bg)',
                  color: 'var(--color-jp-text)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RefreshCw size={14} /> Pull Updates from Phone
              </button>
            </div>
          </section>
        )}

        {/* Last Sync History */}
        {status?.lastSync?.timestamp && (
          <section
            style={{
              background: 'var(--color-jp-surface)',
              border: '1px solid var(--color-jp-border)',
              borderRadius: '12px',
              padding: '20px 24px',
              fontSize: '13px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 600 }}>
              <Clock size={16} color="var(--color-jp-primary)" />
              Recent Sync Activity
            </div>
            <div style={{ color: 'var(--color-jp-text-muted)', fontSize: '12px' }}>
              Last synced with <strong>{status.lastSync.device || 'Android Device'}</strong> at{' '}
              {new Date(status.lastSync.timestamp).toLocaleTimeString()} ({status.lastSync.importedCount} new from phone, {status.lastSync.exportedCount} available on desktop).
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
