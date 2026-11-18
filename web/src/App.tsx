import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import Dashboard from '@/pages/Dashboard';
import Applications from '@/pages/Applications';
import ApplicationNew from '@/pages/ApplicationNew';
import ApplicationDetail from '@/pages/ApplicationDetail';
import QuickAdd from '@/pages/QuickAdd';
import Companies from '@/pages/Companies';
import ImportExport from '@/pages/ImportExport';
import Settings from '@/pages/Settings';
import Sync from '@/pages/Sync';

export default function App() {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        background: 'var(--color-jp-bg)',
        color: 'var(--color-jp-text)',
        overflow: 'hidden',
      }}
    >
      <Sidebar />
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/applications/new" element={<ApplicationNew />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/quick-add" element={<QuickAdd />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/sync" element={<Sync />} />
          <Route path="/import" element={<ImportExport />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
