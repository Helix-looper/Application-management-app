import http from 'http';
import os from 'os';

export const PORT = 3001;

// In-memory sync state
export let sessionPin = Math.floor(1000 + Math.random() * 9000).toString();
export let authToken = 'jp_' + Math.random().toString(36).substring(2, 12);
export let desktopData = {
  version: 1,
  companies: [],
  applications: [],
  interviews: [],
  notes: [],
  status_history: [],
  reminders: [],
};
export let lastSync = {
  timestamp: null,
  device: null,
  importedCount: 0,
  exportedCount: 0,
};

export function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(body);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

export async function handleSyncRequest(req, res, activePort = PORT) {
  const url = req.url || '';

  // Only handle /api endpoints
  if (!url.startsWith('/api/')) {
    return false;
  }

  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return true;
  }

  // Status & discovery
  if (req.method === 'GET' && (url === '/api/status' || url.startsWith('/api/status?'))) {
    sendJson(res, 200, {
      ok: true,
      service: 'JobPilot Desktop Sync Bridge',
      version: '1.0.0',
      ip: getLocalIp(),
      port: activePort,
      pin: sessionPin,
      lastSync,
    });
    return true;
  }

  // Refresh PIN
  if (req.method === 'POST' && url === '/api/refresh-pin') {
    sessionPin = Math.floor(1000 + Math.random() * 9000).toString();
    authToken = 'jp_' + Math.random().toString(36).substring(2, 12);
    sendJson(res, 200, { ok: true, pin: sessionPin });
    return true;
  }

  // Pair from Mobile
  if (req.method === 'POST' && url === '/api/pair') {
    try {
      const body = await parseJsonBody(req);
      if (body.pin === sessionPin) {
        sendJson(res, 200, {
          ok: true,
          token: authToken,
          message: 'Paired successfully with JobPilot Desktop',
        });
      } else {
        sendJson(res, 401, { ok: false, error: 'Invalid pairing PIN' });
      }
    } catch {
      sendJson(res, 400, { ok: false, error: 'Malformed request body' });
    }
    return true;
  }

  // Desktop pushes its IndexedDB state to the sync bridge
  if (req.method === 'POST' && url === '/api/desktop-data') {
    try {
      const body = await parseJsonBody(req);
      desktopData = {
        version: 1,
        companies: body.companies || [],
        applications: body.applications || [],
        interviews: body.interviews || [],
        notes: body.notes || [],
        status_history: body.status_history || [],
        reminders: body.reminders || [],
      };
      sendJson(res, 200, {
        ok: true,
        applicationsCount: desktopData.applications.length,
        companiesCount: desktopData.companies.length,
      });
    } catch {
      sendJson(res, 400, { ok: false, error: 'Invalid data payload' });
    }
    return true;
  }

  // Read desktop data
  if (req.method === 'GET' && url === '/api/desktop-data') {
    sendJson(res, 200, { ok: true, data: desktopData });
    return true;
  }

  // Mobile Sync Endpoint (bidirectional)
  if (req.method === 'POST' && url === '/api/sync') {
    const auth = req.headers['authorization'];
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (token !== authToken) {
      sendJson(res, 403, { ok: false, error: 'Unauthorized. Please pair with the current PIN.' });
      return true;
    }

    try {
      const mobilePayload = await parseJsonBody(req);
      const mobileApps = mobilePayload.applications || [];
      const mobileCompanies = mobilePayload.companies || [];

      // Merge mobile applications
      const existingAppIds = new Set(desktopData.applications.map(a => a.id));
      let newFromMobile = 0;
      for (const mApp of mobileApps) {
        if (!existingAppIds.has(mApp.id)) {
          desktopData.applications.push(mApp);
          existingAppIds.add(mApp.id);
          newFromMobile++;
        }
      }

      // Merge companies
      const existingCompanyIds = new Set(desktopData.companies.map(c => c.id));
      for (const mCo of mobileCompanies) {
        if (!existingCompanyIds.has(mCo.id)) {
          desktopData.companies.push(mCo);
          existingCompanyIds.add(mCo.id);
        }
      }

      lastSync = {
        timestamp: new Date().toISOString(),
        device: mobilePayload.device || 'Android Phone',
        importedCount: newFromMobile,
        exportedCount: desktopData.applications.length,
      };

      sendJson(res, 200, {
        ok: true,
        data: desktopData,
        syncedAt: lastSync.timestamp,
        newFromMobile,
      });
    } catch (e) {
      sendJson(res, 500, { ok: false, error: 'Sync failed: ' + String(e) });
    }
    return true;
  }

  return false;
}

// Standalone runner when executed directly via node
const isMain = process.argv[1] && process.argv[1].endsWith('sync-server.js');
if (isMain) {
  const server = http.createServer(async (req, res) => {
    const handled = await handleSyncRequest(req, res, PORT);
    if (!handled) {
      sendJson(res, 404, { ok: false, error: 'Endpoint not found' });
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIp();
    console.log(`\n======================================================`);
    console.log(`  JobPilot Local Wi-Fi Sync Bridge is RUNNING`);
    console.log(`  Local Network URL : http://${ip}:${PORT}`);
    console.log(`  Pairing PIN       : ${sessionPin}`);
    console.log(`======================================================\n`);
  });
}
